<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An after-school center (tenant). Every non-Super-Admin user, class, subject and fee belongs to exactly one center.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
class Center extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'operating_days' => 'array',
            'established_on' => 'date:Y-m-d',
            'capacity' => 'integer',
        ];
    }

    /** The sections of this Center. */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    /** The subjects of this Center. */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /** The users of this Center. */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** The fees of this Center. */
    public function fees(): HasMany
    {
        return $this->hasMany(Fee::class);
    }
}
