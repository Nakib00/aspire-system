<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    protected $guarded = ['id'];

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
