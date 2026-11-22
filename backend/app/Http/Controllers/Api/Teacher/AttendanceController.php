<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Models\AttendanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AttendanceController extends TeacherScopedController
{
    /** Attendance sheet for one class on one day: every enrolled student with their mark (if any). */
    public function show(Request $request, string $class): JsonResponse
    {
        $section = $this->myClass($request, $class);
        $date = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']])['date'] ?? now()->toDateString();
        $records = $section->attendanceRecords()->whereDate('date', $date)->get()->keyBy('student_id');
        $students = $section->students()->select('users.id', 'name', 'code', 'grade_level')->where('active', true)->orderBy('name')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'code' => $s->code, 'grade_level' => $s->grade_level, 'status' => $records[$s->id]->status ?? null, 'note' => $records[$s->id]->note ?? null]);

        return response()->json(['data' => [
            'date' => $date,
            'taken' => $records->isNotEmpty(),
            'students' => $students,
            'summary' => collect(AttendanceRecord::STATUSES)->mapWithKeys(fn ($s) => [$s => $students->where('status', $s)->count()])->all() + ['unmarked' => $students->whereNull('status')->count()],
        ]]);
    }

    public function store(Request $request, string $class): JsonResponse
    {
        $section = $this->myClass($request, $class);
        $enrolled = $section->students()->pluck('users.id')->all();
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d', 'before_or_equal:tomorrow'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'integer', 'distinct', Rule::in($enrolled)],
            'records.*.status' => ['required', Rule::in(AttendanceRecord::STATUSES)],
            'records.*.note' => ['nullable', 'string', 'max:255'],
        ]);
        DB::transaction(function () use ($section, $data, $request): void {
            foreach ($data['records'] as $record) {
                AttendanceRecord::updateOrCreate(
                    ['section_id' => $section->id, 'student_id' => $record['student_id'], 'date' => $data['date']],
                    ['status' => $record['status'], 'note' => $record['note'] ?? null, 'marked_by' => $request->user()->id],
                );
            }
        });

        return $this->show($request->merge(['date' => $data['date']]), $class);
    }

    /** Attendance history for a class: per-day totals and per-student rates for a date range. */
    public function report(Request $request, string $class): JsonResponse
    {
        $section = $this->myClass($request, $class);
        $range = $request->validate(['from' => ['nullable', 'date_format:Y-m-d'], 'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from']]);
        $from = $range['from'] ?? now()->subDays(29)->toDateString();
        $to = $range['to'] ?? now()->toDateString();
        $records = $section->attendanceRecords()->whereBetween('date', [$from, $to])->get();

        $sessions = $records->groupBy(fn ($r) => $r->date->toDateString())
            ->map(fn ($day, $date) => ['date' => $date] + collect(AttendanceRecord::STATUSES)->mapWithKeys(fn ($s) => [$s => $day->where('status', $s)->count()])->all())
            ->sortKeys()->values();
        $students = $section->students()->select('users.id', 'name', 'code')->orderBy('name')->get()->map(function ($s) use ($records) {
            $mine = $records->where('student_id', $s->id);
            $count = fn (string $status) => $mine->where('status', $status)->count();
            $counted = $count('present') + $count('late') + $count('absent');

            return ['id' => $s->id, 'name' => $s->name, 'code' => $s->code, 'present' => $count('present'), 'late' => $count('late'), 'absent' => $count('absent'), 'excused' => $count('excused'),
                'rate' => $counted ? round((($count('present') + $count('late')) / $counted) * 100) : null];
        });

        return response()->json(['data' => ['from' => $from, 'to' => $to, 'sessions' => $sessions, 'students' => $students]]);
    }
}
