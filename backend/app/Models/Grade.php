<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The marks and feedback a teacher gives a submission. Visible to parents only once `published`.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Grade extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['marks' => 'float', 'published' => 'boolean'];
    }

    /** The submission this Grade belongs to. */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /** The teacher who graded the submission. */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
