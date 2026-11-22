<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

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

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function grade()
    {
        return $this->hasOne(Grade::class);
    }
}
