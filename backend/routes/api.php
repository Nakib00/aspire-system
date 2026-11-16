<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CenterAdminController;
use App\Http\Controllers\Api\CenterController;
use App\Http\Middleware\AuthenticateApiToken;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::middleware(AuthenticateApiToken::class)->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::apiResource('centers', CenterController::class)->except('destroy');
        Route::delete('center-admins/{centerAdmin}/center', [CenterAdminController::class, 'removeCenter']);
        Route::apiResource('center-admins', CenterAdminController::class)->except('destroy');
    });
});
