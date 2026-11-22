<?php

use App\Http\Controllers\Api\CenterAdminController;
use App\Http\Controllers\Api\CenterController;
use Illuminate\Support\Facades\Route;

Route::apiResource('centers', CenterController::class)->except('destroy');
Route::delete('center-admins/{centerAdmin}/center', [CenterAdminController::class, 'removeCenter']);
Route::apiResource('center-admins', CenterAdminController::class)->except('destroy');

