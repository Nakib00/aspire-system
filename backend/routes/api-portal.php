<?php

use App\Http\Controllers\Api\PortalController;
use Illuminate\Support\Facades\Route;

Route::get('portal/announcements', [PortalController::class, 'announcements']);
Route::get('portal/parent', [PortalController::class, 'parent']);
Route::get('portal/teacher', [PortalController::class, 'teacher']);
Route::get('portal/parent/children/{child}/assignments', [PortalController::class, 'childAssignments']);
Route::post('portal/parent/children/{child}/assignments/{assignment}/submission', [PortalController::class, 'submit']);
