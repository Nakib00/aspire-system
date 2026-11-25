<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

/**
 * A private file (PDF or image) attached to an assignment. Exposed to clients only through short-lived signed URLs.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class AssignmentAttachment extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['url'];

    protected $hidden = ['path'];

    /** The assignment this AssignmentAttachment belongs to. */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    /** Short-lived signed link so <img> and <a> tags can load the private file without a bearer token. */
    public function getUrlAttribute(): string
    {
        return URL::temporarySignedRoute('files.attachment', now()->addHours(2), ['attachment' => $this->id], absolute: false);
    }
}
