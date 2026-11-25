<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A bill for a fee issued to a student.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Invoice extends Model
{
    protected $guarded = ['id'];

    /** The fee this Invoice belongs to. */
    public function fee(): BelongsTo
    {
        return $this->belongsTo(Fee::class);
    }

    /** The student being billed. */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** The payments of this Invoice. */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
