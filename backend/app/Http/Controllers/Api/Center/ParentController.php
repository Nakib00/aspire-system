<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Center Admin CRUD for parent accounts. */
class ParentController extends PersonController
{
    /** Manages `parent` users. */
    protected function role(): string
    {
        return 'parent';
    }

    /** Parent codes start with `PAR`. */
    protected function codePrefix(): string
    {
        return 'PAR';
    }

    /** Eager-load the linked children. */
    protected function relations(): array
    {
        return ['children'];
    }

    /** Adds child-linking validation to the parent rules. */
    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        return [
            'student_ids' => ['sometimes', 'array'],
            'student_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->where('center_id', $centerId)->where('role', 'student')],
        ];
    }

    /** Sync the linked children. */
    protected function afterSave(Request $request, int $centerId, User $person, bool $created): void
    {
        if ($request->has('student_ids')) {
            $person->children()->sync($request->input('student_ids', []));
        }
    }
}
