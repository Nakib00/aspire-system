<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Models\Assignment;
use App\Models\AssignmentAttachment;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AssignmentController extends TeacherScopedController
{
    private const MAX_FILES = 8;

    /** @return array<string, mixed> */
    private function rules(Request $request, bool $creating): array
    {
        $partial = $creating ? [] : ['sometimes'];

        return [
            'section_id' => $creating ? ['required', 'integer', Rule::in($request->user()->teacherSections()->where('status', 'active')->pluck('sections.id')->all())] : ['prohibited'],
            'title' => [...$partial, 'required', 'string', 'max:255'],
            'instructions' => [...$partial, 'required', 'string', 'max:10000'],
            'due_at' => [...$partial, 'required', 'date'],
            'max_marks' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'closed'])],
            'youtube_url' => ['nullable', 'string', 'max:255', function (string $attribute, mixed $value, Closure $fail): void {
                if ($value && ! (new Assignment(['youtube_url' => $value]))->youtube_id) {
                    $fail('Enter a valid YouTube video link.');
                }
            }],
            'questions' => ['nullable', 'array', 'max:30'],
            'questions.*.text' => ['required', 'string', 'max:1000'],
            'questions.*.marks' => ['nullable', 'numeric', 'min:0', 'max:1000'],
        ];
    }

    private function withStats($query)
    {
        return $query->with(['section:id,name,subject_id', 'section.subject:id,name', 'attachments'])
            ->withCount(['submissions', 'submissions as graded_count' => fn ($q) => $q->whereHas('grade')]);
    }

    public function index(Request $request): JsonResponse
    {
        $teacherId = $this->teacherId($request);
        $query = $this->withStats(Assignment::where('teacher_id', $teacherId)->whereIn('section_id', $request->user()->teacherSections()->select('sections.id')))->latest('due_at');
        if ($request->filled('section_id')) {
            $query->where('section_id', $request->query('section_id'));
        }
        if (in_array($request->query('status'), ['draft', 'published', 'closed'], true)) {
            $query->where('status', $request->query('status'));
        }
        $assignments = $query->paginate(100);
        $sizes = DB::table('section_student')->whereIn('section_id', $assignments->pluck('section_id'))->selectRaw('section_id, count(*) as total')->groupBy('section_id')->pluck('total', 'section_id');
        $assignments->getCollection()->each(fn ($a) => $a->setAttribute('students_count', $sizes[$a->section_id] ?? 0));

        return response()->json($assignments);
    }

    public function store(Request $request): JsonResponse
    {
        $teacherId = $this->teacherId($request);
        $data = $request->validate($this->rules($request, true));
        $assignment = Assignment::create($data + ['teacher_id' => $teacherId, 'status' => $data['status'] ?? 'draft']);

        return response()->json(['data' => $this->withStats(Assignment::whereKey($assignment->id))->first()], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->myAssignment($request, $id);

        return response()->json(['data' => $this->withStats(Assignment::whereKey($id))->first()]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $assignment = $this->myAssignment($request, $id);
        $assignment->update($request->validate($this->rules($request, false)));

        return response()->json(['data' => $this->withStats(Assignment::whereKey($id))->first()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $assignment = $this->myAssignment($request, $id);
        if ($assignment->submissions()->exists()) {
            return response()->json(['message' => 'Students have already submitted work for this assignment. Close it instead of deleting.'], 422);
        }
        $paths = $assignment->attachments()->pluck('path')->all();
        $assignment->delete();
        Storage::disk('local')->delete($paths);

        return response()->json(['message' => 'Deleted.']);
    }

    public function addAttachment(Request $request, string $id): JsonResponse
    {
        $assignment = $this->myAssignment($request, $id);
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240']]);
        if ($assignment->attachments()->count() >= self::MAX_FILES) {
            return response()->json(['message' => 'You can attach up to '.self::MAX_FILES.' files to an assignment.'], 422);
        }
        $file = $request->file('file');
        $attachment = $assignment->attachments()->create([
            'kind' => strtolower($file->getClientOriginalExtension()) === 'pdf' ? 'pdf' : 'image',
            'path' => $file->store("assignments/{$assignment->id}", 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json(['data' => $attachment], 201);
    }

    public function removeAttachment(Request $request, string $id, string $attachment): JsonResponse
    {
        $assignment = $this->myAssignment($request, $id);
        $file = AssignmentAttachment::where('assignment_id', $assignment->id)->findOrFail($attachment);
        Storage::disk('local')->delete($file->path);
        $file->delete();

        return response()->json(['message' => 'Removed.']);
    }
}
