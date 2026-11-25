<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Models\Assignment;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Teacher dashboard: today's classes, submissions waiting for review and upcoming deadlines.
 *
 * GET /api/v1/teacher/dashboard
 */
class DashboardController extends TeacherScopedController
{
    /** Build the dashboard payload for the signed-in teacher. */
    public function __invoke(Request $request): JsonResponse
    {
        $teacherId = $this->teacherId($request);
        $classes = $request->user()->teacherSections()->where('sections.status', 'active')->with('subject:id,name')->withCount('students')->get();
        $classIds = $classes->pluck('id');
        $today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now()->dayOfWeek];
        $takenToday = DB::table('attendance_records')->whereIn('section_id', $classIds)->where('date', now()->toDateString())->distinct()->pluck('section_id')->all();
        $assignments = Assignment::where('teacher_id', $teacherId)->whereIn('section_id', $classIds)->withCount(['submissions', 'submissions as graded_count' => fn ($q) => $q->whereHas('grade')])->with('section:id,name')->get();
        $sizes = DB::table('section_student')->whereIn('section_id', $classIds)->selectRaw('section_id, count(*) as total')->groupBy('section_id')->pluck('total', 'section_id');
        $assignments->each(fn ($a) => $a->setAttribute('students_count', $sizes[$a->section_id] ?? 0));

        $toReview = $assignments->filter(fn ($a) => $a->submissions_count > $a->graded_count)->sortByDesc(fn ($a) => $a->submissions_count - $a->graded_count)->values();

        return response()->json(['data' => [
            'counts' => [
                'classes' => $classes->count(),
                'students' => DB::table('section_student')->whereIn('section_id', $classIds)->distinct()->count('student_id'),
                'to_review' => $toReview->sum(fn ($a) => $a->submissions_count - $a->graded_count),
                'open_assignments' => $assignments->where('status', 'published')->filter(fn ($a) => $a->due_at->isFuture())->count(),
            ],
            'today' => $classes->filter(fn (Section $c) => in_array($today, $c->days ?? [], true))->sortBy('starts_at')->values()->map(fn (Section $c) => $c->setAttribute('attendance_taken', in_array($c->id, $takenToday))),
            'to_review' => $toReview->take(5)->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'section' => $a->section->name, 'pending' => $a->submissions_count - $a->graded_count]),
            'upcoming' => $assignments->where('status', 'published')->filter(fn ($a) => $a->due_at->isFuture())->sortBy('due_at')->take(5)->values()->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'section' => $a->section->name, 'due_at' => $a->due_at, 'submissions_count' => $a->submissions_count, 'students_count' => $a->students_count]),
        ]]);
    }
}
