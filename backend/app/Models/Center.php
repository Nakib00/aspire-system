<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Center extends Model
{
    protected $guarded = ['id'];

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
