<?php

namespace App\Http\Controllers\Api\Teacher;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends TeacherScopedController
{
    public function index(Request $request): JsonResponse
    {
        $this->teacherId($request);
        $classes = $request->user()->teacherSections()->where('status', 'active')->with('subject:id,name')->withCount('students')->orderBy('name')->get();

        return response()->json(['data' => $classes]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $class = $this->myClass($request, $id)->load(['subject:id,name', 'students' => fn ($q) => $q->select('users.id', 'name', 'code', 'grade_level', 'active')->orderBy('name')])->loadCount('students');

        return response()->json(['data' => $class]);
    }
}
