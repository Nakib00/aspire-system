<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/** Shared behaviour for storing a student's submission (used by student, parent and teacher endpoints). */
trait SavesSubmissions
{
    /** Create or replace a student's submission for an assignment from the request (file and/or text). */
    protected function saveSubmission(Request $request, Assignment $assignment, User $student, User $actor): Submission
    {
        $data = $request->validate([
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,txt', 'max:10240'],
            'text_answer' => ['nullable', 'string', 'max:10000'],
        ]);
        if (! $request->hasFile('file') && blank($data['text_answer'] ?? null)) {
            throw ValidationException::withMessages(['file' => 'Attach a file or write an answer.']);
        }
        $submission = Submission::firstOrNew(['assignment_id' => $assignment->id, 'student_id' => $student->id]);
        $attributes = [
            'text_answer' => $data['text_answer'] ?? null,
            'submitted_at' => now(),
            'opened_at' => null,
            'submitted_by' => $actor->id,
            'status' => $assignment->due_at && now()->greaterThan($assignment->due_at) ? 'late' : 'submitted',
        ];
        if ($request->hasFile('file')) {
            if ($submission->file_path) {
                Storage::disk('local')->delete($submission->file_path);
            }
            $file = $request->file('file');
            $attributes['file_path'] = $file->store("submissions/{$assignment->id}", 'local');
            $attributes['original_name'] = $file->getClientOriginalName();
        }
        $submission->fill($attributes)->save();

        return $submission;
    }
}
