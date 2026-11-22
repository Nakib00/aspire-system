<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\SavesSubmissions;
use App\Http\Controllers\Api\Concerns\ShowsStudentWork;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Everything a signed-in student sees: their classes, class stream, work, results and attendance. */
class StudentPortalController extends Controller
{
    use SavesSubmissions, ShowsStudentWork;

    /** The signed-in student (403 for any other role). */
    private function student(Request $request): User
    {
        abort_unless($request->user()->role === 'student', 403);

        return $request->user();
    }

    /** A class the student is enrolled in (404 otherwise). */
    private function myClass(User $student, string|int $id): Section
    {
        return $student->studentSections()->where('sections.status', 'active')->findOrFail($id);
    }

    /** Whether an assignment still accepts submissions. */
    private function isOpen(Assignment $a): bool
    {
        return $a->status === 'published' && ! $a->submission;
    }

    /**
     * Dashboard payload: stats, work due soon, missing work, announcements and recent results.
     *
     * GET /api/v1/portal/student/overview
     */
    public function overview(Request $request): JsonResponse
    {
        $student = $this->student($request);
        $work = $this->studentWork($student);
        $todo = $work->filter(fn ($a) => $this->isOpen($a) && $a->due_at->isFuture())->sortBy('due_at')->values();
        $missing = $work->filter(fn ($a) => $this->isOpen($a) && $a->due_at->isPast());
        $graded = $work->filter(fn ($a) => $a->grade);
        $sectionIds = $student->studentSections()->pluck('sections.id');
        $attendance = $this->attendanceTotals(AttendanceRecord::where('student_id', $student->id)->get());

        return response()->json(['data' => [
            'profile' => $student->load('center:id,name,code,phone,email,address,city'),
            'stats' => [
                'classes' => $sectionIds->count(),
                'todo' => $todo->count(),
                'missing' => $missing->count(),
                'attendance_rate' => $attendance['rate'],
                'average_percent' => $graded->count() ? (int) round($graded->avg(fn ($a) => $a->grade['marks'] / $a->max_marks * 100)) : null,
            ],
            'due_soon' => $todo->take(5)->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'due_at' => $a->due_at, 'section_id' => $a->section_id, 'section' => $a->section->name, 'subject' => $a->section->getRelation('subject')?->name]),
            'missing' => $missing->take(5)->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'due_at' => $a->due_at, 'section_id' => $a->section_id, 'section' => $a->section->name]),
            'announcements' => Announcement::whereIn('section_id', $sectionIds)->with(['teacher:id,name', 'section:id,name'])->latest()->limit(5)->get(),
            'recent_results' => $graded->take(5)->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'section_id' => $a->section_id, 'section' => $a->section->name, 'marks' => $a->grade['marks'], 'max_marks' => $a->max_marks]),
        ]]);
    }

    /**
     * Classes the student is enrolled in.
     *
     * GET /api/v1/portal/student/classes
     */
    public function classes(Request $request): JsonResponse
    {
        $student = $this->student($request);
        $classes = $student->studentSections()->where('sections.status', 'active')->with(['subject:id,name', 'teachers:id,name'])->orderBy('sections.name')->get();
        $work = $this->studentWork($student)->groupBy('section_id');
        $records = AttendanceRecord::where('student_id', $student->id)->get()->groupBy('section_id');
        $latest = Announcement::whereIn('section_id', $classes->pluck('id'))->with('teacher:id,name')->latest()->get()->groupBy('section_id');

        return response()->json(['data' => $classes->map(fn (Section $c) => $c->makeHidden('pivot')
            ->setAttribute('todo_count', ($work[$c->id] ?? collect())->filter(fn ($a) => $this->isOpen($a))->count())
            ->setAttribute('attendance_rate', $this->attendanceTotals($records[$c->id] ?? collect())['rate'])
            ->setAttribute('latest_announcement', ($latest[$c->id] ?? collect())->first()))->values()]);
    }

    /**
     * One class with its teachers, announcements, assignments and attendance.
     *
     * GET /api/v1/portal/student/classes/{class}
     */
    public function showClass(Request $request, string $class): JsonResponse
    {
        $student = $this->student($request);
        $section = $this->myClass($student, $class)->load(['subject:id,name', 'teachers:id,name,phone,email']);
        $records = AttendanceRecord::where('student_id', $student->id)->where('section_id', $section->id)->orderByDesc('date')->get();

        return response()->json(['data' => [
            'class' => $section->makeHidden('pivot'),
            'classmates' => $section->students()->count() - 1,
            'announcements' => Announcement::where('section_id', $section->id)->with('teacher:id,name')->orderByDesc('pinned')->latest()->limit(50)->get(),
            'assignments' => $this->studentWork($student, [$section->id])->values(),
            'attendance' => $this->attendanceTotals($records) + ['records' => $records->take(60)->map(fn ($record) => ['date' => $record->date->toDateString(), 'status' => $record->status, 'note' => $record->note])->values()],
        ]]);
    }

    /** Every assignment across the student's classes (the "To-do" page). */
    public function assignments(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->studentWork($this->student($request))->values()]);
    }

    /**
     * Released grades and feedback.
     *
     * GET /api/v1/portal/student/results
     */
    public function results(Request $request): JsonResponse
    {
        $work = $this->studentWork($this->student($request))->filter(fn ($a) => $a->grade)->values();
        $rows = $work->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'section_id' => $a->section_id, 'section' => $a->section->name, 'subject' => $a->section->getRelation('subject')?->name, 'due_at' => $a->due_at,
            'submitted_at' => $a->submission['submitted_at'], 'late' => $a->submission['status'] === 'late', 'marks' => $a->grade['marks'], 'max_marks' => $a->max_marks, 'percent' => (int) round($a->grade['marks'] / $a->max_marks * 100), 'feedback' => $a->grade['feedback']]);
        $byClass = $rows->groupBy('section_id')->map(fn ($items) => ['section_id' => $items[0]['section_id'], 'section' => $items[0]['section'], 'subject' => $items[0]['subject'], 'count' => $items->count(), 'average' => (int) round($items->avg('percent'))])->values();

        return response()->json(['data' => ['results' => $rows, 'by_class' => $byClass, 'average' => $rows->count() ? (int) round($rows->avg('percent')) : null]]);
    }

    /**
     * Attendance history and totals.
     *
     * GET /api/v1/portal/student/attendance
     */
    public function attendance(Request $request): JsonResponse
    {
        $student = $this->student($request);
        $records = AttendanceRecord::where('student_id', $student->id)->orderByDesc('date')->get()->groupBy('section_id');
        $classes = $student->studentSections()->with('subject:id,name')->orderBy('sections.name')->get();

        return response()->json(['data' => [
            'overall' => $this->attendanceTotals($records->flatten(1)),
            'classes' => $classes->map(fn (Section $c) => ['id' => $c->id, 'name' => $c->name, 'subject' => $c->getRelation('subject')?->name] + $this->attendanceTotals($records[$c->id] ?? collect()) + ['records' => ($records[$c->id] ?? collect())->take(30)->map(fn ($record) => ['date' => $record->date->toDateString(), 'status' => $record->status, 'note' => $record->note])->values()])->values(),
        ]]);
    }

    /**
     * Submit (or replace) the student's own work.
     *
     * POST /api/v1/portal/student/assignments/{assignment}/submission
     */
    public function submit(Request $request, string $assignment): JsonResponse
    {
        $student = $this->student($request);
        $work = Assignment::whereIn('section_id', $student->studentSections()->select('sections.id'))->where('status', 'published')->findOrFail($assignment);
        if ($work->submissions()->where('student_id', $student->id)->whereHas('grade')->exists()) {
            return response()->json(['message' => 'This work has already been graded and can no longer be changed.'], 422);
        }
        $this->saveSubmission($request, $work, $student, $student);

        return response()->json(['data' => $this->studentWork($student, [$work->section_id])->firstWhere('id', $work->id)]);
    }
}
