<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Center Admin CRUD for students and their guardians. */
class StudentController extends PersonController
{
    /** Manages `student` users. */
    protected function role(): string
    {
        return 'student';
    }

    /** Student codes start with `STU`. */
    protected function codePrefix(): string
    {
        return 'STU';
    }

    /** Students never sign in. */
    protected function canSignIn(): bool
    {
        return false;
    }

    /** Eager-load guardians and classes. */
    protected function relations(): array
    {
        return ['parents', 'studentSections.subject'];
    }

    /** @return array<string, mixed> */
    private function guardianRules(int $centerId, string $prefix): array
    {
        $without = "required_without:{$prefix}parent_id";

        return [
            "{$prefix}parent_id" => ['nullable', 'integer', Rule::exists('users', 'id')->where('center_id', $centerId)->where('role', 'parent')],
            "{$prefix}relationship" => ['nullable', 'string', 'max:40'],
            "{$prefix}name" => [$without, 'nullable', 'string', 'max:255'],
            "{$prefix}email" => [$without, 'nullable', 'email', 'max:255', 'distinct', Rule::unique('users', 'email')],
            "{$prefix}phone" => ['nullable', 'string', 'max:40'],
            "{$prefix}password" => [$without, 'nullable', 'string', 'min:8', 'max:255'],
        ];
    }

    /** Adds guardian validation to the student rules. */
    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        if (is_array($request->input('guardians'))) {
            $request->merge(['guardians' => array_map(fn ($g) => is_array($g) && isset($g['email']) ? [...$g, 'email' => strtolower((string) $g['email'])] : $g, $request->input('guardians'))]);
        }

        return [
            'school_name' => ['nullable', 'string', 'max:255'],
            'grade_level' => ['nullable', 'string', 'max:40'],
            'guardians' => ['sometimes', 'array', 'max:4'],
        ] + $this->guardianRules($centerId, 'guardians.*.');
    }

    /** Link the guardian supplied with the student form. */
    protected function afterSave(Request $request, int $centerId, User $person, bool $created): void
    {
        foreach ($request->input('guardians', []) as $guardian) {
            $this->linkGuardian($guardian, $centerId, $person);
        }
    }

    /** @param  array<string, mixed>  $guardian */
    private function linkGuardian(array $guardian, int $centerId, User $student): void
    {
        $parent = ! empty($guardian['parent_id'])
            ? User::findOrFail($guardian['parent_id'])
            : User::create(['name' => $guardian['name'], 'email' => $guardian['email'], 'phone' => $guardian['phone'] ?? null, 'password' => $guardian['password'], 'role' => 'parent', 'center_id' => $centerId, 'active' => true]);
        if ($parent->wasRecentlyCreated) {
            $parent->update(['code' => 'PAR-'.str_pad((string) $parent->id, 5, '0', STR_PAD_LEFT)]);
        }
        $student->parents()->syncWithoutDetaching([$parent->id => ['relationship' => $guardian['relationship'] ?? null]]);
    }

    /**
     * Link an existing or newly created parent to a student.
     *
     * POST /api/v1/center/students/{student}/guardians
     */
    public function addGuardian(Request $request, string $id): JsonResponse
    {
        $centerId = $this->centerId($request);
        $student = $this->find($request, $id);
        if ($request->has('email')) {
            $request->merge(['email' => strtolower((string) $request->input('email'))]);
        }
        $data = $request->validate($this->guardianRules($centerId, ''));
        DB::transaction(fn () => $this->linkGuardian($data, $centerId, $student));

        return response()->json(['data' => $student->fresh($this->relations())], 201);
    }

    /**
     * Unlink a parent from a student.
     *
     * DELETE /api/v1/center/students/{student}/guardians/{parent}
     */
    public function removeGuardian(Request $request, string $id, string $parent): JsonResponse
    {
        $student = $this->find($request, $id);
        $student->parents()->detach($parent);

        return response()->json(['data' => $student->fresh($this->relations())]);
    }
}
