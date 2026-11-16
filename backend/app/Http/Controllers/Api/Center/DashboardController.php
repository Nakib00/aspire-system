<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\Section;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends CenterScopedController
{
    public function __invoke(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        $people = fn (string $role) => User::where('center_id', $centerId)->where('role', $role);
        $classes = Section::where('center_id', $centerId);
        $today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now()->dayOfWeek];

        $todayClasses = (clone $classes)->where('status', 'active')->with(['subject:id,name', 'teachers:id,name'])->withCount('students')->get()
            ->filter(fn (Section $class) => in_array($today, $class->days ?? [], true))
            ->sortBy('starts_at')->values();

        return response()->json(['data' => [
            'counts' => [
                'teachers' => $people('teacher')->where('active', true)->count(),
                'students' => $people('student')->where('active', true)->count(),
                'parents' => $people('parent')->where('active', true)->count(),
                'subjects' => Subject::where('center_id', $centerId)->where('status', 'active')->count(),
                'classes' => (clone $classes)->where('status', 'active')->count(),
            ],
            'attention' => [
                'students_without_guardian' => $people('student')->where('active', true)->whereDoesntHave('parents')->count(),
                'students_not_enrolled' => $people('student')->where('active', true)->whereDoesntHave('studentSections')->count(),
                'classes_without_teacher' => (clone $classes)->where('status', 'active')->whereDoesntHave('teachers')->count(),
                'full_classes' => (clone $classes)->where('status', 'active')->whereNotNull('capacity')->withCount('students')->get()->filter(fn ($c) => $c->students_count >= $c->capacity)->count(),
            ],
            'enrollment_by_subject' => DB::table('subjects')->leftJoin('sections', 'sections.subject_id', '=', 'subjects.id')->leftJoin('section_student', 'section_student.section_id', '=', 'sections.id')
                ->where('subjects.center_id', $centerId)->groupBy('subjects.id', 'subjects.name')->orderByRaw('count(distinct section_student.student_id) desc')
                ->selectRaw('subjects.name, count(distinct section_student.student_id) as students')->limit(8)->get(),
            'today' => ['day' => $today, 'classes' => $todayClasses],
            'recent_students' => $people('student')->latest('id')->limit(5)->get(['id', 'name', 'code', 'grade_level', 'created_at']),
        ]]);
    }
}
