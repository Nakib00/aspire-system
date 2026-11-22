<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Authentication endpoints: sign in, current user and sign out.
 *
 * Issues and revokes the JWT bearer tokens used by every other endpoint.
 */
class AuthController extends Controller
{
    /**
     * Sign a user in with email and password and issue a bearer token.
     *
     * POST /api/v1/login (throttled to 5 attempts per minute).
     *
     * Inactive users, users without a center (except Super Admin) and placeholder student accounts cannot sign in.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! $user->active || ! in_array($user->role, ['super_admin', 'center_admin', 'teacher', 'parent', 'student'], true) || ($user->role === 'student' && str_ends_with($user->email, '@students.aspire.local')) || ($user->role !== 'super_admin' && ! $user->center_id) || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials or inactive account.'], 401);
        }
        $user->forceFill(['last_login_at' => now()])->save();
        $token = Auth::guard('api')->login($user);

        return response()->json(['token' => $token, 'token_type' => 'Bearer', 'expires_in' => config('jwt.ttl') * 60, 'user' => $user->load('center:id,name,code')]);
    }

    /**
     * Return the signed-in user together with their center.
     *
     * GET /api/v1/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->load('center')]);
    }

    /**
     * Revoke the current token.
     *
     * POST /api/v1/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Logged out.']);
    }
}
