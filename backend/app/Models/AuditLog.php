<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Record of an action performed by a user on an auditable model.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class AuditLog extends Model
{
    protected $guarded = ['id'];

    /** The user who performed the action. */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /** The record this AuditLog refers to (polymorphic). */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
