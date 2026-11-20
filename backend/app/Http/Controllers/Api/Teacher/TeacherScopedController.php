<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Section;
use Illuminate\Http\Request;

abstract class TeacherScopedController extends Controller
{
    protected function teacherId(Request $request): int
    {
        abort_unless($request->user()->role === 'teacher', 403);

        return $request->user()->id;
    }

    /** A class the signed-in teacher is assigned to. Anything else is a 404. */
    protected function myClass(Request $request, int|string $id): Section
    {
        $this->teacherId($request);

        return $request->user()->teacherSections()->where('sections.center_id', $request->user()->center_id)->findOrFail($id);
    }

    /** An assignment that belongs to one of the teacher's classes. */
    protected function myAssignment(Request $request, int|string $id): Assignment
    {
        $teacherId = $this->teacherId($request);

        return Assignment::whereIn('section_id', $request->user()->teacherSections()->select('sections.id'))->where('teacher_id', $teacherId)->findOrFail($id);
    }
}
