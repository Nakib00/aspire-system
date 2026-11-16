<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Center\ClassController;
use App\Http\Controllers\Api\Center\DashboardController;
use App\Http\Controllers\Api\Center\ParentController;
use App\Http\Controllers\Api\Center\StudentController;
use App\Http\Controllers\Api\Center\SubjectController;
use App\Http\Controllers\Api\Center\TeacherController;
use App\Http\Controllers\Api\CenterAdminController;
use App\Http\Controllers\Api\CenterController;
use App\Http\Controllers\Api\PortalController;
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

        Route::get('portal/parent', [PortalController::class, 'parent']);
        Route::get('portal/teacher', [PortalController::class, 'teacher']);

        Route::prefix('center')->group(function (): void {
            Route::get('dashboard', DashboardController::class);
            Route::apiResource('teachers', TeacherController::class);
            Route::apiResource('parents', ParentController::class);
            Route::apiResource('students', StudentController::class);
            Route::post('students/{student}/guardians', [StudentController::class, 'addGuardian']);
            Route::delete('students/{student}/guardians/{parent}', [StudentController::class, 'removeGuardian']);
            Route::apiResource('subjects', SubjectController::class);
            Route::apiResource('classes', ClassController::class)->parameters(['classes' => 'class']);
            Route::post('classes/{class}/students', [ClassController::class, 'enroll']);
            Route::delete('classes/{class}/students/{student}', [ClassController::class, 'unenroll']);
        });
    });
});
