<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function fees()
    {
        return $this->hasMany(Fee::class);
    }
}
