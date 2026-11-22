<?php

use App\Http\Controllers\Api\Center\ClassController;
use App\Http\Controllers\Api\Center\DashboardController;
use App\Http\Controllers\Api\Center\ParentController;
use App\Http\Controllers\Api\Center\StudentController;
use App\Http\Controllers\Api\Center\SubjectController;
use App\Http\Controllers\Api\Center\TeacherController;
use Illuminate\Support\Facades\Route;

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

