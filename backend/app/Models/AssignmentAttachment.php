<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class AssignmentAttachment extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['url'];

    protected $hidden = ['path'];

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /** Short-lived signed link so <img> and <a> tags can load the private file without a bearer token. */
    public function getUrlAttribute(): string
    {
        return URL::temporarySignedRoute('files.attachment', now()->addHours(2), ['attachment' => $this->id], absolute: false);
    }
}
