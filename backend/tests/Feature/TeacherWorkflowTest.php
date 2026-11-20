<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TeacherWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $parent;

    private User $kid;

    private User $other;

    private Section $class;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $center = Center::create(['name' => 'North', 'address' => 'Dhaka']);
        $subject = Subject::create(['center_id' => $center->id, 'name' => 'Math']);
        $this->class = Section::create(['center_id' => $center->id, 'subject_id' => $subject->id, 'subject' => 'Math', 'name' => 'Math A', 'status' => 'active']);
        $make = fn (string $role, array $extra = []) => User::factory()->create(['role' => $role, 'center_id' => $center->id, 'active' => true, 'password' => 'password123'] + $extra);
        $this->teacher = $make('teacher');
        $this->parent = $make('parent');
        $this->kid = $make('student');
        $this->other = $make('student');
        $this->class->teachers()->attach($this->teacher);
        $this->class->students()->attach([$this->kid->id, $this->other->id]);
        $this->parent->children()->attach($this->kid);
        $this->token = $this->login($this->teacher);
    }

    private function login(User $user): string
    {
        return $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'password123'])->assertOk()->json('token');
    }

    private function api(?string $token = null)
    {
        return $this->withToken($token ?? $this->token);
    }

    private function newAssignment(array $extra = []): int
    {
        return $this->api()->postJson('/api/v1/teacher/assignments', $extra + [
            'section_id' => $this->class->id, 'title' => 'Fractions', 'instructions' => 'Do the worksheet', 'due_at' => now()->addDays(3)->toIso8601String(), 'max_marks' => 20, 'status' => 'published',
        ])->assertCreated()->json('data.id');
    }

    public function test_attendance_can_be_taken_updated_and_reported(): void
    {
        $date = now()->toDateString();
        $this->api()->getJson("/api/v1/teacher/classes/{$this->class->id}/attendance")->assertOk()->assertJsonPath('data.taken', false)->assertJsonPath('data.summary.unmarked', 2);
        $this->api()->putJson("/api/v1/teacher/classes/{$this->class->id}/attendance", ['date' => $date, 'records' => [
            ['student_id' => $this->kid->id, 'status' => 'present'], ['student_id' => $this->other->id, 'status' => 'absent', 'note' => 'sick'],
        ]])->assertOk()->assertJsonPath('data.taken', true)->assertJsonPath('data.summary.present', 1)->assertJsonPath('data.summary.absent', 1);
        $this->api()->putJson("/api/v1/teacher/classes/{$this->class->id}/attendance", ['date' => $date, 'records' => [['student_id' => $this->other->id, 'status' => 'late']]])->assertOk()->assertJsonPath('data.summary.late', 1);
        $this->assertDatabaseCount('attendance_records', 2);
        $this->api()->putJson("/api/v1/teacher/classes/{$this->class->id}/attendance", ['date' => now()->addDays(2)->toDateString(), 'records' => [['student_id' => $this->kid->id, 'status' => 'present']]])->assertUnprocessable();
        $this->api()->putJson("/api/v1/teacher/classes/{$this->class->id}/attendance", ['date' => $date, 'records' => [['student_id' => $this->kid->id, 'status' => 'bogus']]])->assertUnprocessable();
        $this->api()->getJson("/api/v1/teacher/classes/{$this->class->id}/attendance/report")->assertOk()->assertJsonPath('data.students.0.rate', 100)->assertJsonCount(1, 'data.sessions');
        $this->api($this->login($this->parent))->getJson('/api/v1/portal/parent')->assertOk()->assertJsonPath('data.children.0.attendance.present', 1);
    }

    public function test_teacher_cannot_touch_classes_they_do_not_teach(): void
    {
        $stranger = Section::create(['center_id' => $this->class->center_id, 'subject' => 'Art', 'name' => 'Art A']);
        $this->api()->getJson("/api/v1/teacher/classes/{$stranger->id}/attendance")->assertNotFound();
        $this->api()->postJson('/api/v1/teacher/assignments', ['section_id' => $stranger->id, 'title' => 'x', 'instructions' => 'y', 'due_at' => now()->addDay()->toIso8601String()])->assertUnprocessable();
        $this->api($this->login($this->parent))->getJson('/api/v1/teacher/dashboard')->assertForbidden();
    }

    public function test_assignment_with_questions_youtube_and_files(): void
    {
        $id = $this->newAssignment(['youtube_url' => 'https://youtu.be/dQw4w9WgXcQ', 'questions' => [['text' => 'What is 1/2 + 1/4?', 'marks' => 5], ['text' => 'Draw 3/4']]]);
        $this->api()->getJson("/api/v1/teacher/assignments/{$id}")->assertOk()->assertJsonPath('data.youtube_id', 'dQw4w9WgXcQ')->assertJsonCount(2, 'data.questions');
        $this->api()->postJson('/api/v1/teacher/assignments', ['section_id' => $this->class->id, 'title' => 'x', 'instructions' => 'y', 'due_at' => now()->addDay()->toIso8601String(), 'youtube_url' => 'https://example.com/video'])->assertUnprocessable();

        $pdf = $this->api()->post("/api/v1/teacher/assignments/{$id}/attachments", ['file' => UploadedFile::fake()->create('worksheet.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.kind', 'pdf');
        $img = $this->api()->post("/api/v1/teacher/assignments/{$id}/attachments", ['file' => UploadedFile::fake()->image('diagram.png')], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.kind', 'image');
        $this->api()->post("/api/v1/teacher/assignments/{$id}/attachments", ['file' => UploadedFile::fake()->create('virus.exe', 10)], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertCount(2, Storage::disk('local')->allFiles("assignments/{$id}"));

        $url = $pdf->json('data.url');
        $this->get($url)->assertOk();
        $this->get(preg_replace('/signature=[^&]+/', 'signature=bad', $url))->assertForbidden();
        $this->api()->deleteJson("/api/v1/teacher/assignments/{$id}/attachments/".$img->json('data.id'))->assertOk();
        $this->assertCount(1, Storage::disk('local')->allFiles("assignments/{$id}"));
        $this->api()->patchJson("/api/v1/teacher/assignments/{$id}", ['title' => 'Fractions 2', 'section_id' => $this->class->id])->assertUnprocessable();
        $this->api()->patchJson("/api/v1/teacher/assignments/{$id}", ['title' => 'Fractions 2'])->assertOk()->assertJsonPath('data.title', 'Fractions 2');
    }

    public function test_submission_review_and_grading_flow(): void
    {
        $id = $this->newAssignment();
        $this->api()->getJson("/api/v1/teacher/assignments/{$id}/submissions")->assertOk()->assertJsonPath('data.stats.missing', 2)->assertJsonPath('data.rows.0.state', 'missing');

        $roster = $this->api()->post("/api/v1/teacher/assignments/{$id}/students/{$this->kid->id}/submission", ['file' => UploadedFile::fake()->image('work.jpg'), 'text_answer' => 'done'], ['Accept' => 'application/json'])->assertOk();
        $roster->assertJsonPath('data.stats.submitted', 1)->assertJsonPath('data.stats.to_review', 1);
        $submissionId = collect($roster->json('data.rows'))->firstWhere('student.id', $this->kid->id)['submission']['id'];
        $this->api()->post("/api/v1/teacher/assignments/{$id}/students/{$this->kid->id}/submission", [], ['Accept' => 'application/json'])->assertUnprocessable();

        $this->api()->getJson("/api/v1/teacher/submissions/{$submissionId}")->assertOk()->assertJsonPath('data.state', 'submitted');
        $this->assertNotNull(Submission::find($submissionId)->opened_at);
        $this->api()->putJson("/api/v1/teacher/submissions/{$submissionId}/grade", ['marks' => 25])->assertUnprocessable();
        $this->api()->putJson("/api/v1/teacher/submissions/{$submissionId}/grade", ['marks' => 17.5, 'feedback' => 'Nice', 'published' => false])->assertOk()->assertJsonPath('data.state', 'graded')->assertJsonPath('data.grade.marks', 17.5);

        $parentToken = $this->login($this->parent);
        $this->api($parentToken)->getJson("/api/v1/portal/parent/children/{$this->kid->id}/assignments")->assertOk()->assertJsonPath('data.0.grade', null)->assertJsonPath('data.0.locked', true);
        $this->api()->postJson("/api/v1/teacher/assignments/{$id}/grades/publish")->assertOk()->assertJsonPath('data.stats.average', 17.5);
        $this->api($parentToken)->getJson("/api/v1/portal/parent/children/{$this->kid->id}/assignments")->assertJsonPath('data.0.grade.marks', 17.5)->assertJsonPath('data.0.grade.feedback', 'Nice');
        $this->api()->getJson('/api/v1/teacher/dashboard')->assertOk()->assertJsonPath('data.counts.to_review', 0);
        $this->api()->deleteJson("/api/v1/teacher/assignments/{$id}")->assertUnprocessable();
        $this->api()->deleteJson("/api/v1/teacher/submissions/{$submissionId}/grade")->assertOk()->assertJsonPath('data.state', 'submitted');
    }

    public function test_parent_can_submit_for_their_child_only_and_only_until_graded(): void
    {
        $id = $this->newAssignment(['due_at' => now()->subDay()->toIso8601String()]);
        $draft = $this->newAssignment(['title' => 'Hidden', 'status' => 'draft']);
        $parentToken = $this->login($this->parent);
        $this->api($parentToken)->getJson("/api/v1/portal/parent/children/{$this->kid->id}/assignments")->assertJsonCount(1, 'data');
        $this->api($parentToken)->getJson("/api/v1/portal/parent/children/{$this->other->id}/assignments")->assertNotFound();
        $this->api($parentToken)->postJson("/api/v1/portal/parent/children/{$this->kid->id}/assignments/{$draft}/submission", ['text_answer' => 'x'])->assertNotFound();
        $this->api($parentToken)->post("/api/v1/portal/parent/children/{$this->kid->id}/assignments/{$id}/submission", ['file' => UploadedFile::fake()->create('hw.pdf', 50, 'application/pdf')], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.0.submission.status', 'late');
        $submission = Submission::first();
        $this->api()->putJson("/api/v1/teacher/submissions/{$submission->id}/grade", ['marks' => 10])->assertOk();
        $this->api($parentToken)->postJson("/api/v1/portal/parent/children/{$this->kid->id}/assignments/{$id}/submission", ['text_answer' => 'again'])->assertUnprocessable();
    }
}
