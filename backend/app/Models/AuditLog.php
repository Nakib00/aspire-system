<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $guarded = ['id'];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function auditable()
    {
        return $this->morphTo();
    }
}
