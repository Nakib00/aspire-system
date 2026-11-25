<?php

use App\Http\Controllers\Api\StudentPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('portal/student')->group(function (): void {
    Route::get('overview', [StudentPortalController::class, 'overview']);
    Route::get('classes', [StudentPortalController::class, 'classes']);
    Route::get('classes/{class}', [StudentPortalController::class, 'showClass']);
    Route::get('assignments', [StudentPortalController::class, 'assignments']);
    Route::post('assignments/{assignment}/submission', [StudentPortalController::class, 'submit']);
    Route::get('results', [StudentPortalController::class, 'results']);
    Route::get('attendance', [StudentPortalController::class, 'attendance']);
});
