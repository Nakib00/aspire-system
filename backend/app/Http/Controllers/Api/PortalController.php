<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\SavesSubmissions;
use App\Http\Controllers\Api\Concerns\ShowsStudentWork;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Section;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Read/submit endpoints for the Parent and Teacher dashboards. */
class PortalController extends Controller
{
    use SavesSubmissions, ShowsStudentWork;

    /**
     * Announcements visible to the signed-in parent or student.
     *
     * GET /api/v1/portal/announcements
     */
    public function announcements(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['parent', 'student'], true), 403);
        $children = $user->role === 'parent' ? $user->children()->with('studentSections:id,name')->get() : collect([$user->load('studentSections:id,name')]);
        $sectionIds = $children->flatMap(fn (User $child) => $child->studentSections->pluck('id'))->unique();
        $items = Announcement::whereIn('section_id', $sectionIds)->with(['teacher:id,name', 'section:id,name'])->orderByDesc('pinned')->latest()->get();

        return response()->json(['data' => $items]);
    }

    /** Resolve a child of the signed-in parent (404 for anyone else's child). */
    private function myChild(Request $request, string $child): User
    {
        abort_unless($request->user()->role === 'parent', 403);

        return $request->user()->children()->findOrFail($child);
    }

    /** Parent dashboard: the parent's children, the classes each attends and recent attendance. */
    public function parent(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'parent', 403);
        $children = $user->children()->with(['studentSections' => fn ($q) => $q->with(['subject:id,name', 'teachers:id,name'])->orderBy('starts_at')])->orderBy('name')->get();
        $recent = AttendanceRecord::whereIn('student_id', $children->pluck('id'))->where('date', '>=', now()->subDays(60)->toDateString())->get()->groupBy('student_id');
        $children->each(function (User $child) use ($recent): void {
            $mine = $recent[$child->id] ?? collect();
            $child->setAttribute('attendance', collect(AttendanceRecord::STATUSES)->mapWithKeys(fn ($s) => [$s => $mine->where('status', $s)->count()])->all());
        });

        return response()->json(['data' => [
            'profile' => $user->load('center:id,name,code,phone,email,address,city'),
            'children' => $children,
        ]]);
    }

    /** A child's published assignments with their submission and (released) grade. */
    public function childAssignments(Request $request, string $child): JsonResponse
    {
        return response()->json(['data' => $this->studentWork($this->myChild($request, $child))->values()]);
    }

    /**
     * Submit work for a child on the parent's behalf.
     *
     * POST /api/v1/portal/parent/children/{child}/assignments/{assignment}/submission
     */
    public function submit(Request $request, string $child, string $assignment): JsonResponse
    {
        $student = $this->myChild($request, $child);
        $work = Assignment::whereIn('section_id', $student->studentSections()->select('sections.id'))->where('status', 'published')->findOrFail($assignment);
        $existing = $work->submissions()->where('student_id', $student->id)->first();
        if ($existing?->grade()->exists()) {
            return response()->json(['message' => 'This work has already been graded and can no longer be changed.'], 422);
        }
        $this->saveSubmission($request, $work, $student, $request->user());

        return $this->childAssignments($request, $child);
    }

    /** Teacher dashboard: the classes a teacher teaches and who is enrolled. */
    public function teacher(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'teacher', 403);
        $classes = $user->teacherSections()->with(['subject:id,name', 'students' => fn ($q) => $q->select('users.id', 'name', 'code', 'grade_level')->orderBy('name')])->withCount('students')->orderBy('name')->get();

        return response()->json(['data' => [
            'profile' => $user->load('center:id,name,code,phone,email,address,city'),
            'classes' => $classes->map(fn (Section $class) => $class),
            'students_total' => $classes->flatMap->students->unique('id')->count(),
        ]]);
    }
}
