<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CenterAdminController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'super_admin', 403);
    }

    private function centerAdmin(User $centerAdmin): User
    {
        abort_unless($centerAdmin->role === 'center_admin', 404);

        return $centerAdmin;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(User::where('role', 'center_admin')->with('center')->orderBy('name')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $request->merge(['email' => strtolower((string) $request->input('email'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'center_id' => ['required', 'integer', Rule::exists('centers', 'id')->where('status', 'active')],
        ]);
        $data['role'] = 'center_admin';
        $data['active'] = true;
        $admin = User::create($data);

        return response()->json(['data' => $admin->load('center')], 201);
    }

    public function show(Request $request, User $centerAdmin): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(['data' => $this->centerAdmin($centerAdmin)->load('center')]);
    }

    public function update(Request $request, User $centerAdmin): JsonResponse
    {
        $this->authorizeAdmin($request);
        $this->centerAdmin($centerAdmin);
        if ($request->has('email')) {
            $request->merge(['email' => strtolower((string) $request->input('email'))]);
        }
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($centerAdmin->id)],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'max:255'],
            'center_id' => ['sometimes', 'required', 'integer', Rule::exists('centers', 'id')->where('status', 'active')],
            'active' => ['sometimes', 'boolean'],
        ]);
        DB::transaction(function () use ($centerAdmin, $data): void {
            $centerChanged = array_key_exists('center_id', $data) && (int) $data['center_id'] !== $centerAdmin->center_id;
            $centerAdmin->update($data);
            if (array_key_exists('password', $data) || (array_key_exists('active', $data) && ! $data['active']) || $centerChanged) {
                $centerAdmin->increment('token_version');
            }
        });

        return response()->json(['data' => $centerAdmin->fresh()->load('center')]);
    }

    public function removeCenter(Request $request, User $centerAdmin): JsonResponse
    {
        $this->authorizeAdmin($request);
        $this->centerAdmin($centerAdmin);

        DB::transaction(function () use ($centerAdmin): void {
            if ($centerAdmin->center_id !== null) {
                $centerAdmin->update(['center_id' => null]);
                $centerAdmin->increment('token_version');
            }
        });

        return response()->json(['data' => $centerAdmin->fresh()->load('center')]);
    }
}
