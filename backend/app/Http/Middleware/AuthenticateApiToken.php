<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates API requests from the `Authorization: Bearer` JWT.
 *
 * Rejects with 401 when the token is missing or invalid, the user is inactive or has no
 * center (Super Admins excepted), or the token's `token_version` no longer matches the user's.
 * Bumping `token_version` therefore signs a user out of every device at once.
 */
class AuthenticateApiToken
{
    /**
     * Resolve the user from the bearer token and continue, or answer 401.
     */
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
        if (! $user || ! $user->active || ($user->role !== 'super_admin' && ! $user->center_id) || ! is_int($version) || $version !== (int) $user->token_version) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
