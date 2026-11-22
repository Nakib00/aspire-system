<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A class: a subject taught at a center on certain days and times, with enrolled students and assigned teachers.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Section extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['days' => 'array', 'capacity' => 'integer', 'starts_on' => 'date:Y-m-d', 'ends_on' => 'date:Y-m-d'];
    }

    /** The subject this Section belongs to. */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /** The center this Section belongs to. */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /** Students enrolled in the class. */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'section_student', 'section_id', 'student_id');
    }

    /** Teachers assigned to the class. */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'section_teacher', 'section_id', 'teacher_id');
    }

    /** The attendance records of this Section. */
    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    /** The assignments of this Section. */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
