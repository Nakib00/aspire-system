<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FileController;
use App\Http\Middleware\AuthenticateApiToken;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::middleware('signed:relative')->group(function (): void {
        Route::get('files/attachments/{attachment}', [FileController::class, 'attachment'])->name('files.attachment');
        Route::get('files/submissions/{submission}', [FileController::class, 'submission'])->name('files.submission');
    });
    Route::middleware(AuthenticateApiToken::class)->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        require __DIR__.'/api-admin.php';
        require __DIR__.'/api-portal.php';
        require __DIR__.'/api-student.php';
        require __DIR__.'/api-teacher.php';
        require __DIR__.'/api-center.php';
    });
});
