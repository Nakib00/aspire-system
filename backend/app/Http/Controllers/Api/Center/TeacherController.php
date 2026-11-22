<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Http\Request;

/** Center Admin CRUD for teacher accounts. */
class TeacherController extends PersonController
{
    /** Manages `teacher` users. */
    protected function role(): string
    {
        return 'teacher';
    }

    /** Teacher codes start with `TCH`. */
    protected function codePrefix(): string
    {
        return 'TCH';
    }

    /** Eager-load assigned classes. */
    protected function relations(): array
    {
        return ['teacherSections.subject'];
    }

    /** Adds teacher-specific validation (qualification, joining date). */
    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        return [
            'qualification' => ['nullable', 'string', 'max:255'],
            'joined_on' => ['nullable', 'date'],
        ];
    }
}
