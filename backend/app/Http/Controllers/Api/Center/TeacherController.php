<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Http\Request;

class TeacherController extends PersonController
{
    protected function role(): string
    {
        return 'teacher';
    }

    protected function codePrefix(): string
    {
        return 'TCH';
    }

    protected function relations(): array
    {
        return ['teacherSections.subject'];
    }

    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        return [
            'qualification' => ['nullable', 'string', 'max:255'],
            'joined_on' => ['nullable', 'date'],
        ];
    }
}
