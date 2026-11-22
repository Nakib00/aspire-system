<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A message a teacher posts to one class (Section). Parents and students of the class can read it.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Announcement extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['pinned' => 'boolean'];
    }

    /** The section this Announcement belongs to. */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** The teacher who posted the announcement. */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
