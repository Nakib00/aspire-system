<?php

use App\Http\Controllers\Api\Teacher\AnnouncementController;
use App\Http\Controllers\Api\Teacher\AssignmentController;
use App\Http\Controllers\Api\Teacher\AttendanceController;
use App\Http\Controllers\Api\Teacher\ClassController as TeacherClassController;
use App\Http\Controllers\Api\Teacher\DashboardController as TeacherDashboardController;
use App\Http\Controllers\Api\Teacher\SubmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('teacher')->group(function (): void {
    Route::get('classes/{class}/announcements', [AnnouncementController::class, 'index']);
    Route::post('classes/{class}/announcements', [AnnouncementController::class, 'store']);
    Route::patch('announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    Route::get('dashboard', TeacherDashboardController::class);
    Route::get('classes', [TeacherClassController::class, 'index']);
    Route::get('classes/{class}', [TeacherClassController::class, 'show']);
    Route::get('classes/{class}/attendance', [AttendanceController::class, 'show']);
    Route::put('classes/{class}/attendance', [AttendanceController::class, 'store']);
    Route::get('classes/{class}/attendance/report', [AttendanceController::class, 'report']);
    Route::apiResource('assignments', AssignmentController::class);
    Route::post('assignments/{assignment}/attachments', [AssignmentController::class, 'addAttachment']);
    Route::delete('assignments/{assignment}/attachments/{attachment}', [AssignmentController::class, 'removeAttachment']);
    Route::get('assignments/{assignment}/submissions', [SubmissionController::class, 'roster']);
    Route::post('assignments/{assignment}/students/{student}/submission', [SubmissionController::class, 'store']);
    Route::post('assignments/{assignment}/grades/publish', [SubmissionController::class, 'publishAll']);
    Route::get('submissions/{submission}', [SubmissionController::class, 'show']);
    Route::put('submissions/{submission}/grade', [SubmissionController::class, 'grade']);
    Route::delete('submissions/{submission}/grade', [SubmissionController::class, 'removeGrade']);
});

