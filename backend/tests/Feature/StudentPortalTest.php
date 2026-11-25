<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Center;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $student;

    private User $classmate;

    private Section $class;

    private Section $otherClass;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $center = Center::create(['name' => 'North', 'address' => 'Dhaka']);
        $subject = Subject::create(['center_id' => $center->id, 'name' => 'Math']);
        $make = fn (string $role) => User::factory()->create(['role' => $role, 'center_id' => $center->id, 'active' => true, 'password' => 'password123']);
        $this->teacher = $make('teacher');
        $this->student = $make('student');
        $this->classmate = $make('student');
        $section = fn (string $name) => Section::create(['center_id' => $center->id, 'subject_id' => $subject->id, 'subject' => 'Math', 'name' => $name, 'status' => 'active']);
        $this->class = $section('Math A');
        $this->otherClass = $section('Math B');
        $this->class->teachers()->attach($this->teacher);
        $this->class->students()->attach([$this->student->id, $this->classmate->id]);
        $this->otherClass->students()->attach($this->classmate);
    }

    private function token(User $user): string
    {
        return $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'password123'])->assertOk()->json('token');
    }

    private function as(User $user)
    {
        return $this->withToken($this->token($user));
    }

    private function assignment(Section $section, array $extra = []): Assignment
    {
        return Assignment::create(array_merge(['section_id' => $section->id, 'teacher_id' => $this->teacher->id, 'title' => 'HW', 'instructions' => 'Do it', 'due_at' => now()->addDays(2), 'status' => 'published', 'max_marks' => 20], $extra));
    }

    public function test_placeholder_student_accounts_cannot_sign_in_but_real_ones_can(): void
    {
        $this->student->update(['email' => 'stu-abc@students.aspire.local']);
        $this->postJson('/api/v1/login', ['email' => $this->student->email, 'password' => 'password123'])->assertUnauthorized();
        $this->student->update(['email' => 'real@example.com']);
        $this->token($this->student);
    }

    public function test_center_admin_can_enable_student_login(): void
    {
        $admin = User::factory()->create(['role' => 'center_admin', 'center_id' => $this->class->center_id, 'active' => true, 'password' => 'password123']);
        $adminToken = $this->token($admin);
        $api = fn () => $this->withToken($adminToken);
        $api()->postJson('/api/v1/center/students', ['name' => 'Kid', 'email' => 'kid@example.com'])->assertUnprocessable();
        $api()->postJson('/api/v1/center/students', ['name' => 'Kid', 'email' => 'kid@students.aspire.local', 'password' => 'password123'])->assertUnprocessable();
        $id = $api()->postJson('/api/v1/center/students', ['name' => 'Kid', 'email' => 'Kid@Example.com', 'password' => 'password123'])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/login', ['email' => 'kid@example.com', 'password' => 'password123'])->assertOk();
        $none = $api()->postJson('/api/v1/center/students', ['name' => 'No login'])->assertCreated()->json('data.email');
        $this->assertStringEndsWith('@students.aspire.local', $none);
        $api()->patchJson("/api/v1/center/students/{$this->student->id}", ['email' => 'sid@example.com', 'password' => 'password123'])->assertOk();
        $this->postJson('/api/v1/login', ['email' => 'sid@example.com', 'password' => 'password123'])->assertOk();
        $this->assertNotNull($id);
    }

    public function test_classes_stream_and_announcements(): void
    {
        $teacherToken = $this->token($this->teacher);
        $teacher = $this->withToken($teacherToken);
        $teacher->postJson("/api/v1/teacher/classes/{$this->class->id}/announcements", ['title' => 'Welcome', 'body' => 'Bring a calculator', 'pinned' => true])->assertCreated();
        $second = $teacher->postJson("/api/v1/teacher/classes/{$this->class->id}/announcements", ['body' => 'Quiz on Sunday'])->assertCreated()->json('data.id');
        $teacher->postJson("/api/v1/teacher/classes/{$this->class->id}/announcements", ['body' => ''])->assertUnprocessable();
        $this->as($this->classmate)->getJson("/api/v1/teacher/classes/{$this->class->id}/announcements")->assertForbidden();
        $this->withToken($teacherToken)->patchJson("/api/v1/teacher/announcements/{$second}", ['body' => 'Quiz on Monday'])->assertOk()->assertJsonPath('data.body', 'Quiz on Monday');

        $student = $this->as($this->student);
        $student->getJson('/api/v1/portal/student/classes')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Math A')->assertJsonPath('data.0.latest_announcement.body', 'Quiz on Monday');
        $detail = $student->getJson("/api/v1/portal/student/classes/{$this->class->id}")->assertOk()->assertJsonPath('data.classmates', 1)->assertJsonPath('data.announcements.0.title', 'Welcome');
        $detail->assertJsonCount(2, 'data.announcements');
        $student->getJson("/api/v1/portal/student/classes/{$this->otherClass->id}")->assertNotFound();
        $this->as($this->teacher)->deleteJson("/api/v1/teacher/announcements/{$second}")->assertOk();
    }

    public function test_student_submits_work_and_sees_only_released_results(): void
    {
        $a = $this->assignment($this->class);
        $draft = $this->assignment($this->class, ['title' => 'Secret', 'status' => 'draft']);
        $foreign = $this->assignment($this->otherClass, ['title' => 'Not mine']);
        $student = $this->as($this->student);

        $student->getJson('/api/v1/portal/student/assignments')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'HW');
        $student->postJson("/api/v1/portal/student/assignments/{$draft->id}/submission", ['text_answer' => 'x'])->assertNotFound();
        $student->postJson("/api/v1/portal/student/assignments/{$foreign->id}/submission", ['text_answer' => 'x'])->assertNotFound();
        $student->postJson("/api/v1/portal/student/assignments/{$a->id}/submission", [])->assertUnprocessable();
        $student->post("/api/v1/portal/student/assignments/{$a->id}/submission", ['text_answer' => 'My answer', 'file' => UploadedFile::fake()->image('work.png')], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.submission.status', 'submitted')->assertJsonPath('data.submission.submitted_by_name', $this->student->name);
        $student->getJson('/api/v1/portal/student/overview')->assertOk()->assertJsonPath('data.stats.todo', 0)->assertJsonPath('data.stats.classes', 1);

        $submission = Submission::first();
        $grade = Grade::create(['submission_id' => $submission->id, 'teacher_id' => $this->teacher->id, 'marks' => 15, 'feedback' => 'Good', 'published' => false]);
        $student->getJson('/api/v1/portal/student/results')->assertOk()->assertJsonCount(0, 'data.results')->assertJsonPath('data.average', null);
        $student->postJson("/api/v1/portal/student/assignments/{$a->id}/submission", ['text_answer' => 'again'])->assertUnprocessable();
        $grade->update(['published' => true]);
        $student->getJson('/api/v1/portal/student/results')->assertJsonPath('data.results.0.percent', 75)->assertJsonPath('data.results.0.feedback', 'Good')->assertJsonPath('data.by_class.0.average', 75)->assertJsonPath('data.average', 75);
        $student->getJson('/api/v1/portal/student/overview')->assertJsonPath('data.stats.average_percent', 75)->assertJsonPath('data.recent_results.0.marks', 15);
    }

    public function test_late_and_missing_work_are_flagged(): void
    {
        $late = $this->assignment($this->class, ['title' => 'Old', 'due_at' => now()->subDay()]);
        $student = $this->as($this->student);
        $student->getJson('/api/v1/portal/student/overview')->assertJsonPath('data.stats.missing', 1)->assertJsonPath('data.missing.0.title', 'Old');
        $student->postJson("/api/v1/portal/student/assignments/{$late->id}/submission", ['text_answer' => 'sorry'])->assertOk()->assertJsonPath('data.submission.status', 'late');
    }

    public function test_attendance_is_summarised_per_class(): void
    {
        $record = fn (Section $s, string $date, string $status) => AttendanceRecord::create(['section_id' => $s->id, 'student_id' => $this->student->id, 'date' => $date, 'status' => $status]);
        $this->otherClass->students()->attach($this->student);
        $record($this->class, '2026-01-05', 'present');
        $record($this->class, '2026-01-06', 'late');
        $record($this->class, '2026-01-07', 'absent');
        $record($this->class, '2026-01-08', 'excused');
        $record($this->otherClass, '2026-01-05', 'present');
        $student = $this->as($this->student);
        $res = $student->getJson('/api/v1/portal/student/attendance')->assertOk()->assertJsonPath('data.overall.present', 2)->assertJsonPath('data.overall.rate', 75);
        $mathA = collect($res->json('data.classes'))->firstWhere('name', 'Math A');
        $this->assertSame(67, $mathA['rate']);
        $this->assertCount(4, $mathA['records']);
        $student->getJson("/api/v1/portal/student/classes/{$this->class->id}")->assertJsonPath('data.attendance.late', 1)->assertJsonPath('data.attendance.records.0.date', '2026-01-08');
    }

    public function test_student_portal_is_for_students_only(): void
    {
        $this->as($this->teacher)->getJson('/api/v1/portal/student/overview')->assertForbidden();
        $this->as($this->student)->getJson('/api/v1/teacher/dashboard')->assertForbidden();
        $this->as($this->student)->getJson('/api/v1/center/students')->assertForbidden();
    }
}
