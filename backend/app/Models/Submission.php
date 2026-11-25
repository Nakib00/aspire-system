<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\URL;

/**
 * A student's answer to an assignment (text and/or file). Replaced when the student resubmits.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Submission extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['file_url'];

    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime', 'opened_at' => 'datetime'];
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path
            ? URL::temporarySignedRoute('files.submission', now()->addHours(2), ['submission' => $this->id], absolute: false)
            : null;
    }

    /** The assignment this Submission belongs to. */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    /** The student the work belongs to. */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** Who uploaded the work (the student, a parent or a teacher). */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /** The grade record of this Submission. */
    public function grade(): HasOne
    {
        return $this->hasOne(Grade::class);
    }
}
