<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A subject a center teaches (e.g. Mathematics). Classes (sections) are instances of a subject.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Subject extends Model
{
    protected $guarded = ['id'];

    /** The center this Subject belongs to. */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /** The sections of this Subject. */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }
}
