<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcements_are_visible_only_to_enrolled_students_and_their_parents(): void
    {
        $center = Center::create(['name' => 'Demo', 'address' => 'Dhaka']);
        $make = fn (string $role) => User::factory()->create(['role' => $role, 'center_id' => $center->id, 'active' => true, 'password' => 'password123']);
        $teacher = $make('teacher');
        $student = $make('student');
        $parent = $make('parent');
        $outsider = $make('student');
        $class = Section::create(['center_id' => $center->id, 'name' => 'Math', 'subject' => 'Math', 'status' => 'active']);
        $class->teachers()->attach($teacher);
        $class->students()->attach($student);
        $student->parents()->attach($parent, ['relationship' => 'Parent']);
        $token = fn (User $user) => $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'password123'])->assertOk()->json('token');
        $teacherToken = $token($teacher);
        $studentToken = $token($student);
        $parentToken = $token($parent);
        $outsiderToken = $token($outsider);

        $id = $this->withToken($teacherToken)->postJson("/api/v1/teacher/classes/{$class->id}/announcements", ['title' => 'Welcome', 'body' => 'Bring a notebook'])->assertCreated()->json('data.id');
        foreach ([$studentToken, $parentToken] as $readerToken) {
            $this->withToken($readerToken)->getJson('/api/v1/portal/announcements')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.body', 'Bring a notebook')->assertJsonPath('data.0.section.name', 'Math');
        }
        $this->withToken($outsiderToken)->getJson('/api/v1/portal/announcements')->assertOk()->assertJsonCount(0, 'data');
        $this->withToken($teacherToken)->getJson('/api/v1/portal/announcements')->assertForbidden();
        $this->withToken($teacherToken)->patchJson("/api/v1/teacher/announcements/{$id}", ['body' => 'Bring a calculator'])->assertOk();
        $this->withToken($parentToken)->getJson('/api/v1/portal/announcements')->assertJsonPath('data.0.body', 'Bring a calculator');
        $this->withToken($teacherToken)->deleteJson("/api/v1/teacher/announcements/{$id}")->assertOk();
        $this->withToken($studentToken)->getJson('/api/v1/portal/announcements')->assertJsonCount(0, 'data');
    }
}
