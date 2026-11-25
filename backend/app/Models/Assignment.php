<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Work a teacher sets for a class: instructions, questions, due date, optional YouTube video and file attachments.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Assignment extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['youtube_id'];

    protected function casts(): array
    {
        return ['due_at' => 'datetime', 'questions' => 'array', 'max_marks' => 'integer'];
    }

    public function getYoutubeIdAttribute(): ?string
    {
        if (! $this->youtube_url) {
            return null;
        }
        preg_match('~(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{11})~', $this->youtube_url, $matches);

        return $matches[1] ?? null;
    }

    /** The attachments of this Assignment. */
    public function attachments(): HasMany
    {
        return $this->hasMany(AssignmentAttachment::class);
    }

    /** The section this Assignment belongs to. */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** The teacher who set the assignment. */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /** The submissions of this Assignment. */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
