<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $guard = Auth::guard('api');
            $guard->forgetUser();
            if ($request->bearerToken()) {
                $guard->setToken($request->bearerToken());
            }
            $user = $request->bearerToken() ? $guard->user() : null;
            $version = $user ? $guard->payload()->get('token_version') : null;
        } catch (JWTException $exception) {
            $user = null;
            $version = null;
        }
        if (! $user || ! $user->active || ($user->role === 'center_admin' && ! $user->center_id) || ! is_int($version) || $version !== (int) $user->token_version) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
