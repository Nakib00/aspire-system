<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['name', 'email', 'password', 'role', 'center_id', 'active'])]
#[Hidden(['password', 'remember_token', 'token_version'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['token_version' => (int) $this->token_version];
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function children()
    {
        return $this->belongsToMany(User::class, 'parent_student', 'parent_id', 'student_id');
    }

    public function parents()
    {
        return $this->belongsToMany(User::class, 'parent_student', 'student_id', 'parent_id');
    }

    public function studentSections()
    {
        return $this->belongsToMany(Section::class, 'section_student', 'student_id', 'section_id');
    }

    public function teacherSections()
    {
        return $this->belongsToMany(Section::class, 'section_teacher', 'teacher_id', 'section_id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }
}
