<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ParentController extends PersonController
{
    protected function role(): string
    {
        return 'parent';
    }

    protected function codePrefix(): string
    {
        return 'PAR';
    }

    protected function relations(): array
    {
        return ['children'];
    }

    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        return [
            'student_ids' => ['sometimes', 'array'],
            'student_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->where('center_id', $centerId)->where('role', 'student')],
        ];
    }

    protected function afterSave(Request $request, int $centerId, User $person, bool $created): void
    {
        if ($request->has('student_ids')) {
            $person->children()->sync($request->input('student_ids', []));
        }
    }
}
