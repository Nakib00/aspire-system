<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Collection;

/** Builds the "what has this student been given, handed in and scored" view for students and their parents. */
trait ShowsStudentWork
{
    /**
     * Published/closed assignments for a student's classes with their submission and (released) grade.
     *
     * @param  array<int, int>|null  $sectionIds
     * @return Collection<int, Assignment>
     */
    protected function studentWork(User $student, ?array $sectionIds = null): Collection
    {
        $sections = $student->studentSections()->select('sections.id');
        $assignments = Assignment::whereIn('section_id', $sections)->whereIn('status', ['published', 'closed'])
            ->when($sectionIds !== null, fn ($q) => $q->whereIn('section_id', $sectionIds))
            ->with(['section:id,name,subject_id', 'section.subject:id,name', 'teacher:id,name', 'attachments'])->orderByDesc('due_at')->get();
        $submissions = Submission::where('student_id', $student->id)->with(['grade', 'submittedBy:id,name'])->whereIn('assignment_id', $assignments->pluck('id'))->get()->keyBy('assignment_id');

        return $assignments->map(fn (Assignment $a) => $this->presentWork($a, $submissions[$a->id] ?? null));
    }

    protected function presentWork(Assignment $assignment, ?Submission $submission): Assignment
    {
        $grade = $submission?->grade?->published ? $submission->grade : null;

        return $assignment->setAttribute('submission', $submission ? $submission->only(['id', 'submitted_at', 'status', 'text_answer', 'original_name', 'file_url']) + ['submitted_by_name' => $submission->submittedBy?->name] : null)
            ->setAttribute('grade', $grade?->only(['marks', 'feedback']))
            ->setAttribute('locked', (bool) $submission?->grade);
    }

    /** @return array{present: int, late: int, absent: int, excused: int, rate: int|null} */
    protected function attendanceTotals(Collection $records): array
    {
        $count = fn (string $status) => $records->where('status', $status)->count();
        $counted = $count('present') + $count('late') + $count('absent');

        return collect(AttendanceRecord::STATUSES)->mapWithKeys(fn ($s) => [$s => $count($s)])->all()
            + ['rate' => $counted ? (int) round((($count('present') + $count('late')) / $counted) * 100) : null];
    }
}
