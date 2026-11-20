<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends TeacherScopedController
{
    private function mine(Request $request, string $id): Announcement
    {
        $this->teacherId($request);

        return Announcement::whereIn('section_id', $request->user()->teacherSections()->select('sections.id'))->findOrFail($id);
    }

    public function index(Request $request, string $class): JsonResponse
    {
        $section = $this->myClass($request, $class);
        $items = Announcement::where('section_id', $section->id)->with('teacher:id,name')->orderByDesc('pinned')->latest()->paginate(100);

        return response()->json($items);
    }

    public function store(Request $request, string $class): JsonResponse
    {
        $section = $this->myClass($request, $class);
        $data = $request->validate(['title' => ['nullable', 'string', 'max:255'], 'body' => ['required', 'string', 'max:5000'], 'pinned' => ['sometimes', 'boolean']]);
        $item = Announcement::create($data + ['section_id' => $section->id, 'teacher_id' => $request->user()->id]);

        return response()->json(['data' => $item->load('teacher:id,name')], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = $this->mine($request, $id);
        $item->update($request->validate(['title' => ['nullable', 'string', 'max:255'], 'body' => ['sometimes', 'required', 'string', 'max:5000'], 'pinned' => ['sometimes', 'boolean']]));

        return response()->json(['data' => $item->load('teacher:id,name')]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->mine($request, $id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
