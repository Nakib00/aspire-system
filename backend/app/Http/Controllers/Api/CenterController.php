<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CenterController extends Controller
{
    private const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'super_admin', 403);
    }

    /** @return array<string, mixed> */
    private function rules(?Center $center = null): array
    {
        $partial = $center ? ['sometimes'] : [];

        return [
            'name' => [...$partial, 'required', 'string', 'max:255', Rule::unique('centers')->ignore($center?->id)],
            'address' => [...$partial, 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:30', 'alpha_dash', Rule::unique('centers')->ignore($center?->id)],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'established_on' => ['nullable', 'date', 'before_or_equal:today'],
            'opens_at' => ['nullable', 'date_format:H:i'],
            'closes_at' => ['nullable', 'date_format:H:i', 'after:opens_at'],
            'operating_days' => ['nullable', 'array'],
            'operating_days.*' => ['string', 'distinct', Rule::in(self::DAYS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(
            Center::withCount(['users', 'users as admins_count' => fn ($q) => $q->where('role', 'center_admin')])
                ->orderBy('name')->paginate(20)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate($this->rules());
        $data['code'] = ($data['code'] ?? null) ?: null;
        $center = Center::create($data);
        if (! $center->code) {
            $center->update(['code' => sprintf('CTR-%03d', $center->id)]);
        }

        return response()->json(['data' => $center->fresh()], 201);
    }

    public function show(Request $request, Center $center): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(['data' => $center->loadCount('users')->load(['users' => fn ($query) => $query->where('role', 'center_admin')])]);
    }

    public function update(Request $request, Center $center): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate($this->rules($center));
        if (array_key_exists('code', $data) && ! $data['code']) {
            unset($data['code']);
        }
        $center->update($data);

        return response()->json(['data' => $center->fresh()]);
    }
}
