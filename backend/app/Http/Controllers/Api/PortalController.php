<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    /** Parent dashboard: the parent's children and the classes each one attends. */
    public function parent(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'parent', 403);
        $children = $user->children()->with(['studentSections' => fn ($q) => $q->with(['subject:id,name', 'teachers:id,name'])->orderBy('starts_at')])->orderBy('name')->get();

        return response()->json(['data' => [
            'profile' => $user->load('center:id,name,code,phone,email,address,city'),
            'children' => $children,
        ]]);
    }

    /** Teacher dashboard: the classes a teacher teaches and who is enrolled. */
    public function teacher(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'teacher', 403);
        $classes = $user->teacherSections()->with(['subject:id,name', 'students' => fn ($q) => $q->select('users.id', 'name', 'code', 'grade_level')->orderBy('name')])->withCount('students')->orderBy('name')->get();

        return response()->json(['data' => [
            'profile' => $user->load('center:id,name,code,phone,email,address,city'),
            'classes' => $classes->map(fn (Section $class) => $class),
            'students_total' => $classes->flatMap->students->unique('id')->count(),
        ]]);
    }
}
