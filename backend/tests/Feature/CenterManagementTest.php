<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CenterManagementTest extends TestCase
{
    use RefreshDatabase;

    private Center $center;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->center = Center::create(['name' => 'North', 'address' => 'Dhaka']);
        $admin = User::factory()->create(['role' => 'center_admin', 'center_id' => $this->center->id, 'active' => true, 'password' => 'password123']);
        $this->token = $this->loginAs($admin->email);
    }

    private function loginAs(string $email, string $password = 'password123'): string
    {
        return $this->postJson('/api/v1/login', ['email' => $email, 'password' => $password])->assertOk()->json('token');
    }

    private function api(?string $token = null)
    {
        return $this->withToken($token ?? $this->token);
    }

    public function test_only_center_admins_can_use_center_endpoints(): void
    {
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $superToken = $this->loginAs($super->email);
        $this->flushHeaders()->getJson('/api/v1/center/students')->assertUnauthorized();
        $this->api($superToken)->getJson('/api/v1/center/students')->assertForbidden();
    }

    public function test_teacher_crud_and_login(): void
    {
        $id = $this->api()->postJson('/api/v1/center/teachers', ['name' => 'Tina', 'email' => 'Tina@Example.com', 'password' => 'password123', 'qualification' => 'MSc', 'phone' => '017'])
            ->assertCreated()->assertJsonPath('data.code', 'TCH-'.str_pad((string) User::where('email', 'tina@example.com')->value('id'), 5, '0', STR_PAD_LEFT))->json('data.id');
        $this->api()->postJson('/api/v1/center/teachers', ['name' => 'Dup', 'email' => 'tina@example.com', 'password' => 'password123'])->assertUnprocessable();
        $this->api()->getJson('/api/v1/center/teachers?q=tin')->assertOk()->assertJsonCount(1, 'data');
        $this->api()->patchJson('/api/v1/center/teachers/'.$id, ['qualification' => 'PhD'])->assertOk()->assertJsonPath('data.qualification', 'PhD');
        $teacherToken = $this->loginAs('tina@example.com');
        $this->api($teacherToken)->getJson('/api/v1/portal/teacher')->assertOk();
        $this->api($teacherToken)->getJson('/api/v1/center/teachers')->assertForbidden();
        $this->api()->patchJson('/api/v1/center/teachers/'.$id, ['active' => false])->assertOk();
        $this->api($teacherToken)->getJson('/api/v1/portal/teacher')->assertUnauthorized();
        $this->api()->deleteJson('/api/v1/center/teachers/'.$id)->assertOk();
        $this->api()->getJson('/api/v1/center/teachers/'.$id)->assertNotFound();
    }

    public function test_people_are_scoped_to_the_admins_center(): void
    {
        $other = Center::create(['name' => 'South', 'address' => 'Dhaka']);
        $foreign = User::factory()->create(['role' => 'student', 'center_id' => $other->id]);
        $this->api()->getJson('/api/v1/center/students/'.$foreign->id)->assertNotFound();
        $this->api()->deleteJson('/api/v1/center/students/'.$foreign->id)->assertNotFound();
        $this->api()->postJson('/api/v1/center/parents', ['name' => 'P', 'email' => 'p@example.com', 'password' => 'password123', 'student_ids' => [$foreign->id]])->assertUnprocessable();
    }

    public function test_student_with_new_and_existing_guardians_and_parent_dashboard(): void
    {
        $student = $this->api()->postJson('/api/v1/center/students', [
            'name' => 'Sam', 'grade_level' => '5', 'gender' => 'male', 'date_of_birth' => '2016-03-04',
            'guardians' => [['name' => 'Mom', 'email' => 'mom@example.com', 'password' => 'password123', 'relationship' => 'Mother']],
        ])->assertCreated()->assertJsonPath('data.parents.0.pivot.relationship', 'Mother');
        $studentId = $student->json('data.id');
        $this->assertStringStartsWith('STU-', $student->json('data.code'));
        $this->assertStringContainsString('@students.aspire.local', User::find($studentId)->email);
        $this->postJson('/api/v1/login', ['email' => User::find($studentId)->email, 'password' => 'x'])->assertUnauthorized();

        $dadId = $this->api()->postJson('/api/v1/center/parents', ['name' => 'Dad', 'email' => 'dad@example.com', 'password' => 'password123'])->assertCreated()->json('data.id');
        $this->api()->postJson("/api/v1/center/students/{$studentId}/guardians", ['parent_id' => $dadId, 'relationship' => 'Father'])->assertCreated()->assertJsonCount(2, 'data.parents');
        $this->api()->postJson('/api/v1/center/students', ['name' => 'Bad', 'guardians' => [['name' => 'X']]])->assertUnprocessable();

        $subject = $this->api()->postJson('/api/v1/center/subjects', ['name' => 'Math'])->assertCreated()->json('data.id');
        $class = $this->api()->postJson('/api/v1/center/classes', ['subject_id' => $subject, 'name' => 'Math A', 'days' => ['sat'], 'starts_at' => '10:00', 'ends_at' => '11:00'])->assertCreated()->json('data.id');
        $this->api()->postJson("/api/v1/center/classes/{$class}/students", ['student_ids' => [$studentId]])->assertOk()->assertJsonPath('data.students_count', 1);

        $parentToken = $this->loginAs('mom@example.com');
        $this->api($parentToken)->getJson('/api/v1/portal/parent')->assertOk()->assertJsonPath('data.children.0.name', 'Sam')->assertJsonPath('data.children.0.student_sections.0.subject.name', 'Math');
        $this->api($parentToken)->getJson('/api/v1/portal/teacher')->assertForbidden();

        $this->api()->deleteJson("/api/v1/center/students/{$studentId}/guardians/{$dadId}")->assertOk()->assertJsonCount(1, 'data.parents');
        $this->api()->patchJson('/api/v1/center/parents/'.$dadId, ['student_ids' => [$studentId]])->assertOk()->assertJsonCount(1, 'data.children');
    }

    public function test_subjects_classes_enrollment_rules(): void
    {
        $subject = $this->api()->postJson('/api/v1/center/subjects', ['name' => 'Art', 'code' => 'ART'])->assertCreated()->json('data.id');
        $this->api()->postJson('/api/v1/center/subjects', ['name' => 'Art'])->assertUnprocessable();
        $teacher = $this->api()->postJson('/api/v1/center/teachers', ['name' => 'T', 'email' => 't@example.com', 'password' => 'password123'])->json('data.id');
        $payload = ['subject_id' => $subject, 'name' => 'Art 1', 'capacity' => 1, 'teacher_ids' => [$teacher]];
        $class = $this->api()->postJson('/api/v1/center/classes', $payload + ['starts_at' => '12:00', 'ends_at' => '11:00'])->assertUnprocessable();
        $class = $this->api()->postJson('/api/v1/center/classes', $payload)->assertCreated()->assertJsonPath('data.teachers.0.id', $teacher)->json('data.id');
        $this->api()->postJson('/api/v1/center/classes', $payload)->assertUnprocessable();

        $a = $this->api()->postJson('/api/v1/center/students', ['name' => 'A'])->json('data.id');
        $b = $this->api()->postJson('/api/v1/center/students', ['name' => 'B'])->json('data.id');
        $this->api()->postJson("/api/v1/center/classes/{$class}/students", ['student_ids' => [$a, $b]])->assertUnprocessable();
        $this->api()->postJson("/api/v1/center/classes/{$class}/students", ['student_ids' => [$a]])->assertOk()->assertJsonPath('enrolled', 1);
        $this->api()->postJson("/api/v1/center/classes/{$class}/students", ['student_ids' => [$a]])->assertOk()->assertJsonPath('enrolled', 0);
        $this->api()->getJson('/api/v1/center/subjects')->assertJsonPath('data.0.students_count', 1)->assertJsonPath('data.0.sections_count', 1);
        $this->api()->deleteJson("/api/v1/center/subjects/{$subject}")->assertUnprocessable();

        $dashboard = $this->api()->getJson('/api/v1/center/dashboard')->assertOk();
        $dashboard->assertJsonPath('data.counts.students', 2)->assertJsonPath('data.attention.students_not_enrolled', 1)->assertJsonPath('data.attention.full_classes', 1)->assertJsonPath('data.attention.students_without_guardian', 2);

        $this->api()->deleteJson("/api/v1/center/classes/{$class}/students/{$a}")->assertOk()->assertJsonPath('data.students_count', 0);
        $this->api()->patchJson("/api/v1/center/subjects/{$subject}", ['name' => 'Fine Art'])->assertOk();
        $this->api()->getJson("/api/v1/center/classes/{$class}")->assertJsonPath('data.subject.name', 'Fine Art');
        $this->api()->deleteJson("/api/v1/center/classes/{$class}")->assertOk();
        $this->api()->deleteJson("/api/v1/center/subjects/{$subject}")->assertOk();
    }
}
