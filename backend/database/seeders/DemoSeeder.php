<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Center;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Demo data for trying out every role: php artisan db:seed --class=DemoSeeder
 * All demo accounts use the password "Password123" and an @aspire.test email.
 */
class DemoSeeder extends Seeder
{
    private const PASSWORD = 'Password123';

    public function run(): void
    {
        if (Center::where('code', 'DEMO-01')->exists()) {
            $this->command?->warn('Demo data already exists — skipping.');

            return;
        }
        mt_srand(42);

        $center = Center::create([
            'name' => 'Dhanmondi Learning Hub', 'code' => 'DEMO-01', 'address' => 'House 12, Road 5, Dhanmondi', 'city' => 'Dhaka', 'postal_code' => '1205',
            'phone' => '+880 1700-000000', 'email' => 'hello@dhanmondihub.test', 'contact_person' => 'Farzana Rahman', 'contact_phone' => '+880 1711-000111',
            'capacity' => 150, 'established_on' => '2021-02-01', 'opens_at' => '14:00', 'closes_at' => '19:00', 'operating_days' => ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
            'notes' => 'Demo center with sample data.', 'status' => 'active',
        ]);

        $person = fn (string $role, string $prefix, string $name, array $extra = []) => tap(User::create(array_merge([
            'name' => $name, 'email' => strtolower(str_replace(' ', '.', $name)).'@aspire.test', 'password' => self::PASSWORD, 'role' => $role, 'center_id' => $center->id, 'active' => true,
        ], $extra)), fn (User $u) => $u->update(['code' => $prefix.'-'.str_pad((string) $u->id, 5, '0', STR_PAD_LEFT)]));

        $person('center_admin', 'ADM', 'Center Admin', ['email' => 'center.admin@aspire.test', 'designation' => 'Center manager', 'phone' => '01700000001']);

        $teachers = collect([
            ['Nusrat Jahan', 'MSc in Mathematics'], ['Tanvir Ahmed', 'BA in English Literature'], ['Sabina Yasmin', 'BSc in Physics'],
        ])->map(fn ($t) => $person('teacher', 'TCH', $t[0], ['qualification' => $t[1], 'phone' => '0171'.mt_rand(1000000, 9999999), 'joined_on' => '2022-01-10', 'gender' => 'female']));
        [$maths, $english, $science] = $teachers;

        $subjects = collect(['Mathematics' => 'MATH', 'English' => 'ENG', 'Science' => 'SCI', 'Art & Craft' => 'ART'])->map(fn ($code, $name) => Subject::create(['center_id' => $center->id, 'name' => $name, 'code' => $code, 'description' => "{$name} for school-age learners."]));

        $today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now()->dayOfWeek];
        $class = fn (string $subject, string $name, array $days, string $from, string $to, int $capacity, string $room, User $teacher) => tap(Section::create([
            'center_id' => $center->id, 'subject_id' => $subjects[$subject]->id, 'subject' => $subject, 'name' => $name, 'days' => $days, 'starts_at' => $from, 'ends_at' => $to,
            'capacity' => $capacity, 'room' => $room, 'starts_on' => now()->subMonths(2)->toDateString(), 'ends_on' => now()->addMonths(4)->toDateString(), 'status' => 'active',
        ]), fn (Section $s) => $s->teachers()->attach($teacher));

        $classes = [
            $class('Mathematics', 'Math — Grade 5', array_unique(['sat', 'mon', $today]), '15:00', '16:00', 8, 'Room 1', $maths),
            $class('Mathematics', 'Math — Grade 3', ['sun', 'tue'], '14:00', '15:00', 10, 'Room 1', $maths),
            $class('English', 'English Reading Circle', array_unique(['sun', 'wed', $today]), '16:00', '17:00', 10, 'Room 2', $english),
            $class('Science', 'Fun with Science', ['mon', 'thu'], '16:30', '17:30', 12, 'Lab', $science),
            $class('Art & Craft', 'Art Studio', ['wed'], '17:00', '18:00', 12, 'Room 3', $english),
        ];

        $families = [
            ['Karim Hossain', 'Father', [['Ayaan Hossain', '5'], ['Anika Hossain', '3']]], ['Rehana Begum', 'Mother', [['Sadia Akter', '5']]],
            ['Imran Chowdhury', 'Father', [['Rafi Chowdhury', '5']]], ['Shirin Sultana', 'Mother', [['Mim Sultana', '3'], ['Tamim Sultana', '5']]],
            ['Jamal Uddin', 'Father', [['Nabil Uddin', '3']]], ['Farida Khan', 'Mother', [['Zara Khan', '4']]],
            ['Mahfuz Alam', 'Father', [['Ishan Alam', '4']]], ['Laila Noor', 'Mother', [['Mahi Noor', '4']]],
        ];
        $students = collect();
        foreach ($families as [$parentName, $relationship, $kids]) {
            $parent = $person('parent', 'PAR', $parentName, ['phone' => '0181'.mt_rand(1000000, 9999999)]);
            foreach ($kids as [$kidName, $grade]) {
                $kid = User::create(['name' => $kidName, 'email' => strtolower(str_replace(' ', '.', $kidName)).'@aspire.test', 'password' => self::PASSWORD, 'role' => 'student', 'center_id' => $center->id, 'active' => true,
                    'grade_level' => $grade, 'school_name' => 'Dhanmondi Govt. School', 'gender' => mt_rand(0, 1) ? 'male' : 'female', 'date_of_birth' => now()->subYears(5 + (int) $grade)->toDateString()]);
                $kid->update(['code' => 'STU-'.str_pad((string) $kid->id, 5, '0', STR_PAD_LEFT)]);
                $kid->parents()->attach($parent, ['relationship' => $relationship]);
                $students->push($kid);
            }
        }
        $person('student', 'STU', 'Unlinked Student', ['grade_level' => '4']);

        $byGrade = fn (array $g) => $students->filter(fn ($s) => in_array($s->grade_level, $g))->pluck('id')->all();
        $classes[0]->students()->attach($byGrade(['5']));
        $classes[1]->students()->attach($byGrade(['3']));
        $classes[2]->students()->attach($students->pluck('id')->take(9)->all());
        $classes[3]->students()->attach($byGrade(['4', '5']));
        $classes[4]->students()->attach($students->pluck('id')->slice(2, 6)->all());

        Announcement::create(['section_id' => $classes[0]->id, 'teacher_id' => $maths->id, 'title' => 'Welcome to mathematics', 'body' => 'Please bring your notebook and a pencil to class.', 'pinned' => true]);
        Announcement::create(['section_id' => $classes[2]->id, 'teacher_id' => $english->id, 'title' => 'Reading circle', 'body' => 'Bring your favourite short story to share.']);

        $this->attendance($classes);
        $this->assignments($classes, [$maths, $english, $science]);
    }

    /** Two weeks of attendance on the days each class meets. */
    private function attendance(array $classes): void
    {
        $map = ['sun' => 0, 'mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6];
        foreach ($classes as $class) {
            $teacher = $class->teachers()->first();
            for ($i = 14; $i >= 1; $i--) {
                $date = now()->subDays($i);
                if (! collect($class->days)->contains(fn ($d) => $map[$d] === $date->dayOfWeek)) {
                    continue;
                }
                foreach ($class->students as $student) {
                    $roll = mt_rand(1, 100);
                    AttendanceRecord::create(['section_id' => $class->id, 'student_id' => $student->id, 'date' => $date->toDateString(), 'marked_by' => $teacher->id,
                        'status' => $roll <= 78 ? 'present' : ($roll <= 88 ? 'late' : ($roll <= 96 ? 'absent' : 'excused')), 'note' => $roll > 96 ? 'Family event' : null]);
                }
            }
        }
    }

    /** @param  array<int, Section>  $classes */
    private function assignments(array $classes, array $teachers): void
    {
        $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 18 Tf 30 100 Td (Sample worksheet) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF";
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        $make = function (Section $class, User $teacher, string $title, string $instructions, int $dueInDays, string $status, int $max, array $extra = []) {
            return Assignment::create(array_merge(['section_id' => $class->id, 'teacher_id' => $teacher->id, 'title' => $title, 'instructions' => $instructions, 'due_at' => now()->addDays($dueInDays)->setTime(17, 0),
                'status' => $status, 'max_marks' => $max, 'attachment_path' => null], $extra));
        };
        $attach = function (Assignment $a, string $name, string $kind, string $contents) {
            $path = "assignments/{$a->id}/".$name;
            Storage::disk('local')->put($path, $contents);
            $a->attachments()->create(['kind' => $kind, 'path' => $path, 'original_name' => $name, 'mime' => $kind === 'pdf' ? 'application/pdf' : 'image/png', 'size' => strlen($contents)]);
        };

        $fractions = $make($classes[0], $teachers[0], 'Fractions worksheet', "Solve the questions on the worksheet and show your working.\nTake a clear photo of your page and upload it.", -4, 'published', 20, [
            'youtube_url' => 'https://www.youtube.com/watch?v=n0FZhQ_GkKw',
            'questions' => [['text' => 'What is 1/2 + 1/4?', 'marks' => 4], ['text' => 'Shade 3/4 of a circle and explain what you did.', 'marks' => 6], ['text' => 'Which is bigger: 2/3 or 3/5? Why?', 'marks' => 10]],
        ]);
        $attach($fractions, 'fractions-worksheet.pdf', 'pdf', $pdf);
        $attach($fractions, 'fraction-wall.png', 'image', $png);
        $multiplication = $make($classes[0], $teachers[0], 'Times tables practice', 'Practise your 6, 7 and 8 times tables. Type your answers or upload a photo.', 5, 'published', 10, ['questions' => [['text' => 'Write the 7 times table up to 12.', 'marks' => 5], ['text' => 'What is 8 × 9?', 'marks' => 5]]]);
        $make($classes[1], $teachers[0], 'Counting in tens', 'Count in tens up to 200 and draw 5 groups of 10.', -9, 'closed', 10);
        $story = $make($classes[2], $teachers[1], 'My favourite animal', 'Write 5 sentences about your favourite animal. Use at least two describing words.', 2, 'published', 15, ['youtube_url' => 'https://youtu.be/dQw4w9WgXcQ', 'questions' => [['text' => 'Which animal did you choose?'], ['text' => 'What does it look like?', 'marks' => 5]]]);
        $make($classes[3], $teachers[2], 'Float or sink?', 'Test 5 household objects and record whether they float or sink.', 9, 'draft', 10);

        $submit = function (Assignment $a, User $student, ?string $text, string $status, ?array $grade = null, bool $withFile = false) use ($png) {
            $data = ['assignment_id' => $a->id, 'student_id' => $student->id, 'submitted_at' => $a->due_at->copy()->subHours($status === 'late' ? -20 : 6), 'status' => $status, 'text_answer' => $text, 'submitted_by' => $student->parents()->first()?->id];
            if ($withFile) {
                $path = "submissions/{$a->id}/{$student->id}.png";
                Storage::disk('local')->put($path, $png);
                $data += ['file_path' => $path, 'original_name' => 'homework-photo.png'];
            }
            $sub = Submission::create($data);
            if ($grade) {
                Grade::create(['submission_id' => $sub->id, 'teacher_id' => $a->teacher_id, 'marks' => $grade[0], 'feedback' => $grade[1], 'published' => $grade[2] ?? true]);
                $sub->update(['opened_at' => now()]);
            }
        };

        $five = $classes[0]->students()->orderBy('users.id')->get();
        $submit($fractions, $five[0], null, 'submitted', [18, 'Excellent work, Ayaan! Great explanation for question 3.'], true);
        $submit($fractions, $five[1], 'I did 1/2 + 1/4 = 3/4. Shaded a circle.', 'submitted', [14, 'Good start — check question 3 again.', false]);
        $submit($fractions, $five[2], null, 'submitted', null, true);
        $submit($fractions, $five[3], 'Answer 1: 3/4. Answer 2: shaded 3 parts. Answer 3: 2/3.', 'late');
        $submit($multiplication, $five[0], '7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84. 8 x 9 = 72', 'submitted');
        $readers = $classes[2]->students()->orderBy('users.id')->get();
        $submit($story, $readers[0], 'My favourite animal is the elephant. It is very big and grey.', 'submitted');
    }
}
