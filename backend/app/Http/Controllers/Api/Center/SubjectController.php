<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SubjectController extends CenterScopedController
{
    private function find(Request $request, string $id): Subject
    {
        return Subject::where('center_id', $this->centerId($request))->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function rules(int $centerId, ?Subject $subject): array
    {
        $partial = $subject ? ['sometimes'] : [];

        return [
            'name' => [...$partial, 'required', 'string', 'max:255', Rule::unique('subjects')->where('center_id', $centerId)->ignore($subject?->id)],
            'code' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        $enrolled = DB::table('section_student')->join('sections', 'sections.id', '=', 'section_student.section_id')
            ->whereColumn('sections.subject_id', 'subjects.id')->selectRaw('count(distinct section_student.student_id)');
        $subjects = Subject::where('center_id', $centerId)->withCount('sections')->selectSub($enrolled, 'students_count')->orderBy('name')->paginate(100);

        return response()->json($subjects);
    }

    public function store(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        $data = $request->validate($this->rules($centerId, null));

        return response()->json(['data' => Subject::create($data + ['center_id' => $centerId])->fresh()], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json(['data' => $this->find($request, $id)->load('sections')]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $subject = $this->find($request, $id);
        $data = $request->validate($this->rules($subject->center_id, $subject));
        DB::transaction(function () use ($subject, $data): void {
            $subject->update($data);
            if (isset($data['name'])) {
                $subject->sections()->update(['subject' => $data['name']]);
            }
        });

        return response()->json(['data' => $subject->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $subject = $this->find($request, $id);
        if ($subject->sections()->exists()) {
            return response()->json(['message' => 'This subject still has classes. Remove or move its classes first, or mark the subject inactive.'], 422);
        }
        $subject->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
