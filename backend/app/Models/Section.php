<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['days' => 'array', 'capacity' => 'integer', 'starts_on' => 'date:Y-m-d', 'ends_on' => 'date:Y-m-d'];
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'section_student', 'section_id', 'student_id');
    }

    public function teachers()
    {
        return $this->belongsToMany(User::class, 'section_teacher', 'section_id', 'teacher_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }
}
