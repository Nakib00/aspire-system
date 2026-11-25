<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Shared CRUD for the people a center admin manages (teachers, students, parents).
 */
abstract class PersonController extends CenterScopedController
{
    abstract protected function role(): string;

    abstract protected function codePrefix(): string;

    /** Students never sign in, so they need no email or password. */
    protected function canSignIn(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    protected function extraRules(Request $request, int $centerId, ?User $person): array
    {
        return [];
    }

    /** @return array<int, string> */
    protected function relations(): array
    {
        return [];
    }

    /** Hook run inside the save transaction after the person is created or updated. */
    protected function afterSave(Request $request, int $centerId, User $person, bool $created): void {}

    /** Base query restricted to this role and center. */
    protected function query(int $centerId): Builder
    {
        return User::query()->where('center_id', $centerId)->where('role', $this->role());
    }

    /** Find a person of this role in the admin's center (404 otherwise). */
    protected function find(Request $request, int|string $id): User
    {
        return $this->query($this->centerId($request))->with($this->relations())->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function rules(int $centerId, ?User $person, Request $request): array
    {
        $partial = $person ? ['sometimes'] : [];
        $rules = [
            'name' => [...$partial, 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'active' => ['sometimes', 'boolean'],
        ];
        if ($this->canSignIn()) {
            $rules['email'] = [...$partial, 'required', 'email', 'max:255', Rule::unique('users')->ignore($person?->id)];
            $rules['password'] = [...($person ? ['sometimes'] : ['required']), 'string', 'min:8', 'max:255'];
        } else {
            $rules['email'] = ['nullable', 'email', 'max:255', 'not_regex:/@students\.aspire\.local$/i', Rule::unique('users')->ignore($person?->id)];
            $rules['password'] = [$person ? 'sometimes' : 'required_with:email', 'nullable', 'string', 'min:8', 'max:255'];
        }

        return $rules + $this->extraRules($request, $centerId, $person);
    }

    /**
     * List people.
     *
     * GET /api/v1/center/{people}
     */
    public function index(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        $query = $this->query($centerId)->with($this->relations())->orderBy('name');
        if ($search = trim((string) $request->query('q'))) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
        }
        if (in_array($request->query('status'), ['active', 'inactive'], true)) {
            $query->where('active', $request->query('status') === 'active');
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Create a person.
     *
     * POST /api/v1/center/{people}
     */
    public function store(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        if ($request->has('email')) {
            $request->merge(['email' => strtolower((string) $request->input('email')) ?: null]);
        }
        $data = $request->validate($this->rules($centerId, null, $request));
        $person = DB::transaction(function () use ($request, $centerId, $data): User {
            $attributes = collect($data)->only((new User)->getFillable())->all();
            if (! $this->canSignIn()) {
                $attributes['email'] ??= 'stu-'.Str::lower(Str::random(12)).'@students.aspire.local';
                $attributes['password'] ??= Str::random(40);
            }
            $person = User::create($attributes + ['role' => $this->role(), 'center_id' => $centerId, 'active' => $data['active'] ?? true]);
            $person->update(['code' => $this->codePrefix().'-'.str_pad((string) $person->id, 5, '0', STR_PAD_LEFT)]);
            $this->afterSave($request, $centerId, $person, true);

            return $person;
        });

        return response()->json(['data' => $person->fresh($this->relations())], 201);
    }

    /**
     * Show one person.
     *
     * GET /api/v1/center/{people}/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json(['data' => $this->find($request, $id)]);
    }

    /**
     * Update a person.
     *
     * PUT|PATCH /api/v1/center/{people}/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $centerId = $this->centerId($request);
        $person = $this->find($request, $id);
        if ($request->has('email')) {
            $request->merge(['email' => strtolower((string) $request->input('email')) ?: null]);
        }
        $data = $request->validate($this->rules($centerId, $person, $request));
        if (array_key_exists('email', $data) && $data['email'] === null) {
            unset($data['email']);
        }
        if (array_key_exists('password', $data) && $data['password'] === null) {
            unset($data['password']);
        }
        DB::transaction(function () use ($request, $centerId, $person, $data): void {
            $person->update(collect($data)->only((new User)->getFillable())->except('code')->all());
            if (array_key_exists('password', $data) || (array_key_exists('active', $data) && ! $data['active'])) {
                $person->increment('token_version');
            }
            $this->afterSave($request, $centerId, $person, false);
        });

        return response()->json(['data' => $person->fresh($this->relations())]);
    }

    /**
     * Delete a person.
     *
     * DELETE /api/v1/center/{people}/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $person = $this->find($request, $id);
        try {
            DB::transaction(fn () => $person->delete());
        } catch (QueryException) {
            return response()->json(['message' => 'This person has linked records (such as assignments or payments) and cannot be deleted. Mark the account inactive instead.'], 422);
        }

        return response()->json(['message' => 'Deleted.']);
    }
}
