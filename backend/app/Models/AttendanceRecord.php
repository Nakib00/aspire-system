<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One student's attendance mark (present, late, absent or excused) for one class on one date.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class AttendanceRecord extends Model
{
    public const STATUSES = ['present', 'late', 'absent', 'excused'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d'];
    }

    /** The section this AttendanceRecord belongs to. */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** The student the mark is for. */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
