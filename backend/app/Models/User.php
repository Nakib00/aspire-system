<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['name', 'email', 'password', 'role', 'center_id', 'active', 'phone', 'designation', 'last_login_at', 'code', 'gender', 'date_of_birth', 'address', 'school_name', 'grade_level', 'qualification', 'joined_on', 'notes'])]
#[Hidden(['password', 'remember_token', 'token_version'])]
/**
 * Every person who signs in or is managed by the system. `role` is one of super_admin, center_admin, teacher, parent, student.
 *
 * Model in the MVC architecture: owns the data, relations and casts for this table.
 */
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

    /** The center the user belongs to (null for Super Admins). */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /** Students linked to this parent (pivot `relationship`). */
    public function children(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'parent_student', 'parent_id', 'student_id')->withPivot('relationship');
    }

    /** Parents/guardians linked to this student (pivot `relationship`). */
    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'parent_student', 'student_id', 'parent_id')->withPivot('relationship');
    }

    /** Classes this student is enrolled in. */
    public function studentSections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class, 'section_student', 'student_id', 'section_id');
    }

    /** Classes this teacher teaches. */
    public function teacherSections(): BelongsToMany
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
            'last_login_at' => 'datetime',
            'date_of_birth' => 'date:Y-m-d',
            'joined_on' => 'date:Y-m-d',
        ];
    }
}
