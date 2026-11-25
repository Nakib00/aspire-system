<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A payment recorded against an invoice.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Payment extends Model
{
    protected $guarded = ['id'];

    /** The invoice this Payment belongs to. */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** The user who recorded the payment. */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
