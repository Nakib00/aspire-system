<?php

namespace App\Http\Controllers\Api\Center;

use App\Models\Section;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * A "class" is a scheduled group for one subject (the `sections` table): teachers teach it, students enroll in it.
 */
class ClassController extends CenterScopedController
{
    private const RELATIONS = ['subject', 'teachers:id,name,code'];

    /** Find a class of the admin's own center (404 otherwise). */
    private function find(Request $request, string $id): Section
    {
        return Section::where('center_id', $this->centerId($request))->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function rules(Request $request, int $centerId, ?Section $class): array
    {
        $partial = $class ? ['sometimes'] : [];
        $subjectId = $request->input('subject_id', $class?->subject_id);

        return [
            'subject_id' => [...$partial, 'required', 'integer', Rule::exists('subjects', 'id')->where('center_id', $centerId)->where('status', 'active')],
            'name' => [...$partial, 'required', 'string', 'max:255', Rule::unique('sections')->where('center_id', $centerId)->where('subject_id', $subjectId)->ignore($class?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'room' => ['nullable', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'days' => ['nullable', 'array'],
            'days.*' => ['string', 'distinct', Rule::in(self::DAYS)],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i', 'after:starts_at'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'teacher_ids' => ['sometimes', 'array'],
            'teacher_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->where('center_id', $centerId)->where('role', 'teacher')->where('active', true)],
        ];
    }

    /**
     * List classes.
     *
     * GET /api/v1/center/classes
     */
    public function index(Request $request): JsonResponse
    {
        $query = Section::where('center_id', $this->centerId($request))->with(self::RELATIONS)->withCount('students')->orderBy('name');
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->query('subject_id'));
        }
        if (in_array($request->query('status'), ['active', 'inactive'], true)) {
            $query->where('status', $request->query('status'));
        }
        if ($search = trim((string) $request->query('q'))) {
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(100));
    }

    /**
     * Create a class.
     *
     * POST /api/v1/center/classes
     */
    public function store(Request $request): JsonResponse
    {
        $centerId = $this->centerId($request);
        $data = $request->validate($this->rules($request, $centerId, null));
        $class = DB::transaction(function () use ($data, $centerId): Section {
            $class = Section::create(collect($data)->except('teacher_ids')->all() + ['center_id' => $centerId, 'subject' => Subject::findOrFail($data['subject_id'])->name]);
            $class->teachers()->sync($data['teacher_ids'] ?? []);

            return $class;
        });

        return response()->json(['data' => $class->fresh(self::RELATIONS)->loadCount('students')], 201);
    }

    /**
     * Show one class.
     *
     * GET /api/v1/center/classes/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $class = $this->find($request, $id)->load([...self::RELATIONS, 'students' => fn ($q) => $q->select('users.id', 'name', 'code', 'grade_level', 'active')->orderBy('name')])->loadCount('students');

        return response()->json(['data' => $class]);
    }

    /**
     * Update a class.
     *
     * PUT|PATCH /api/v1/center/classes/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $class = $this->find($request, $id);
        $data = $request->validate($this->rules($request, $class->center_id, $class));
        if (isset($data['capacity']) && $data['capacity'] < $class->students()->count()) {
            throw ValidationException::withMessages(['capacity' => 'Capacity cannot be lower than the '.$class->students()->count().' students already enrolled.']);
        }
        DB::transaction(function () use ($class, $data): void {
            $attributes = collect($data)->except('teacher_ids')->all();
            if (isset($data['subject_id'])) {
                $attributes['subject'] = Subject::findOrFail($data['subject_id'])->name;
            }
            $class->update($attributes);
            if (array_key_exists('teacher_ids', $data)) {
                $class->teachers()->sync($data['teacher_ids']);
            }
        });

        return response()->json(['data' => $class->fresh(self::RELATIONS)->loadCount('students')]);
    }

    /**
     * Delete a class.
     *
     * DELETE /api/v1/center/classes/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $class = $this->find($request, $id);
        if ($class->assignments()->exists()) {
            return response()->json(['message' => 'This class has assignments and cannot be deleted. Mark it inactive instead.'], 422);
        }
        $class->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    /**
     * Enrol students into a class, respecting its capacity.
     *
     * POST /api/v1/center/classes/{class}/students
     */
    public function enroll(Request $request, string $id): JsonResponse
    {
        $centerId = $this->centerId($request);
        $class = $this->find($request, $id);
        $data = $request->validate([
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->where('center_id', $centerId)->where('role', 'student')->where('active', true)],
        ]);
        $new = array_values(array_diff($data['student_ids'], $class->students()->pluck('users.id')->all()));
        if ($class->capacity && $class->students()->count() + count($new) > $class->capacity) {
            throw ValidationException::withMessages(['student_ids' => 'Not enough seats: this class has room for '.max(0, $class->capacity - $class->students()->count()).' more student(s).']);
        }
        $class->students()->attach($new);

        return response()->json(['data' => $class->load([...self::RELATIONS, 'students:id,name,code,grade_level,active'])->loadCount('students'), 'enrolled' => count($new)]);
    }

    /**
     * Remove a student from a class.
     *
     * DELETE /api/v1/center/classes/{class}/students/{student}
     */
    public function unenroll(Request $request, string $id, string $student): JsonResponse
    {
        $class = $this->find($request, $id);
        $class->students()->detach($student);

        return response()->json(['data' => $class->load([...self::RELATIONS, 'students:id,name,code,grade_level,active'])->loadCount('students')]);
    }
}
