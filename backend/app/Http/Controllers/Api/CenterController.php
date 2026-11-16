<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CenterController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'super_admin', 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(Center::withCount('users')->orderBy('name')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('centers')],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        return response()->json(['data' => Center::create($data)->fresh()], 201);
    }

    public function show(Request $request, Center $center): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(['data' => $center->loadCount('users')->load(['users' => fn ($query) => $query->where('role', 'center_admin')])]);
    }

    public function update(Request $request, Center $center): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('centers')->ignore($center->id)],
            'address' => ['sometimes', 'required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);
        $center->update($data);

        return response()->json(['data' => $center->fresh()]);
    }
}
