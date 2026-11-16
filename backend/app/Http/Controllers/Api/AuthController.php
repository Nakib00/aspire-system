<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! $user->active || ! in_array($user->role, ['super_admin', 'center_admin'], true) || ($user->role === 'center_admin' && ! $user->center_id) || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials or inactive account.'], 401);
        }
        $token = Auth::guard('api')->login($user);

        return response()->json(['token' => $token, 'token_type' => 'Bearer', 'expires_in' => config('jwt.ttl') * 60, 'user' => $user]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->load('center')]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Logged out.']);
    }
}
