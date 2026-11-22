<?php

namespace App\Http\Controllers\Api\Center;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Base controller for every `/center/*` endpoint.
 *
 * Guarantees the caller is a Center Admin and exposes their center id so queries are always scoped to one tenant.
 */
abstract class CenterScopedController extends Controller
{
    protected const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

    /** Only center admins may use these endpoints, and only for their own center. */
    protected function centerId(Request $request): int
    {
        $user = $request->user();
        abort_unless($user->role === 'center_admin' && $user->center_id, 403);

        return (int) $user->center_id;
    }
}
