<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Api\Concerns\SavesSubmissions;
use App\Models\Assignment;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Teacher review of student submissions: roster, grading and releasing grades. */
class SubmissionController extends TeacherScopedController
{
    use SavesSubmissions;

    /** A submission to one of the teacher's assignments (404 otherwise). */
    private function mySubmission(Request $request, string $id): Submission
    {
        $this->teacherId($request);
        $submission = Submission::with('assignment')->findOrFail($id);
        $this->myAssignment($request, $submission->assignment_id);

        return $submission;
    }

    /** @return array<string, mixed> One roster line: a student, their submission (if any) and its grade. */
    private function row(User $student, ?Submission $submission): array
    {
        $state = ! $submission ? 'missing' : ($submission->grade ? 'graded' : ($submission->status === 'late' ? 'late' : 'submitted'));

        return [
            'student' => ['id' => $student->id, 'name' => $student->name, 'code' => $student->code, 'grade_level' => $student->grade_level],
            'state' => $state,
            'submission' => $submission ? $submission->only(['id', 'submitted_at', 'opened_at', 'status', 'text_answer', 'original_name', 'file_url']) + ['submitted_by_name' => $submission->submittedBy?->name] : null,
            'grade' => $submission?->grade?->only(['marks', 'feedback', 'published', 'updated_at']),
        ];
    }

    /** Build the roster response for an assignment. */
    private function rosterFor(Assignment $assignment): JsonResponse
    {
        $assignment->load(['section:id,name,subject_id', 'section.subject:id,name', 'attachments']);
        $submissions = $assignment->submissions()->with(['grade', 'submittedBy:id,name'])->get()->keyBy('student_id');
        $students = $assignment->section->students()->select('users.id', 'name', 'code', 'grade_level')->orderBy('name')->get();
        $rows = $students->map(fn (User $s) => $this->row($s, $submissions[$s->id] ?? null))->values();
        $graded = $rows->where('state', 'graded');

        return response()->json(['data' => [
            'assignment' => $assignment,
            'rows' => $rows,
            'stats' => [
                'total' => $rows->count(),
                'submitted' => $rows->where('state', '!=', 'missing')->count(),
                'late' => $rows->where('state', 'late')->count() + $graded->filter(fn ($r) => $r['submission']['status'] === 'late')->count(),
                'graded' => $graded->count(),
                'to_review' => $rows->whereIn('state', ['submitted', 'late'])->count(),
                'missing' => $rows->where('state', 'missing')->count(),
                'average' => $graded->count() ? round($graded->avg(fn ($r) => $r['grade']['marks']), 1) : null,
            ],
        ]]);
    }

    /**
     * Every enrolled student with their submission and grade.
     *
     * GET /api/v1/teacher/assignments/{assignment}/submissions
     */
    public function roster(Request $request, string $assignment): JsonResponse
    {
        return $this->rosterFor($this->myAssignment($request, $assignment));
    }

    /** Record work on a student's behalf (a photo of their homework, for example). */
    public function store(Request $request, string $assignment, string $student): JsonResponse
    {
        $assignment = $this->myAssignment($request, $assignment);
        $child = $assignment->section->students()->findOrFail($student);
        $this->saveSubmission($request, $assignment, $child, $request->user());

        return $this->rosterFor($assignment);
    }

    /**
     * One submission; marks it as opened.
     *
     * GET /api/v1/teacher/submissions/{submission}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $submission = $this->mySubmission($request, $id);
        $submission->opened_at ??= now();
        $submission->save();
        $student = $submission->student;

        return response()->json(['data' => $this->row($student, $submission->load(['grade', 'submittedBy:id,name']))]);
    }

    /**
     * Create or update the grade and feedback for a submission.
     *
     * PUT /api/v1/teacher/submissions/{submission}/grade
     */
    public function grade(Request $request, string $id): JsonResponse
    {
        $submission = $this->mySubmission($request, $id);
        $data = $request->validate([
            'marks' => ['required', 'numeric', 'min:0', 'max:'.$submission->assignment->max_marks],
            'feedback' => ['nullable', 'string', 'max:2000'],
            'published' => ['sometimes', 'boolean'],
        ]);
        Grade::updateOrCreate(['submission_id' => $submission->id], ['teacher_id' => $request->user()->id, 'marks' => $data['marks'], 'feedback' => $data['feedback'] ?? null, 'published' => $data['published'] ?? true]);
        $submission->opened_at ??= now();
        $submission->save();

        return response()->json(['data' => $this->row($submission->student, $submission->load(['grade', 'submittedBy:id,name']))]);
    }

    /**
     * Remove a grade.
     *
     * DELETE /api/v1/teacher/submissions/{submission}/grade
     */
    public function removeGrade(Request $request, string $id): JsonResponse
    {
        $submission = $this->mySubmission($request, $id);
        $submission->grade()->delete();

        return response()->json(['data' => $this->row($submission->student, $submission->load(['grade', 'submittedBy:id,name']))]);
    }

    /** Release every graded submission of an assignment to parents. */
    public function publishAll(Request $request, string $assignment): JsonResponse
    {
        $assignment = $this->myAssignment($request, $assignment);
        Grade::whereIn('submission_id', $assignment->submissions()->select('id'))->update(['published' => true]);

        return $this->rosterFor($assignment);
    }
}
