<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A fee a center charges, from which invoices are generated.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Fee extends Model
{
    protected $guarded = ['id'];

    /** The center this Fee belongs to. */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /** The invoices of this Fee. */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
