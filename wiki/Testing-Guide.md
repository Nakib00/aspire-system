# Testing Guide

## Where we are

| Layer | Tool | Status |
|-------|------|--------|
| Backend API | PHPUnit 12 (Laravel feature tests) | **27 tests, 311 assertions, all passing** |
| Backend units | PHPUnit `tests/Unit` | none yet (the folder exists) |
| Frontend | none yet | `npm run lint` and `npm run build` are the only checks |
| Continuous integration | GitHub Actions | workflow exists but is **not active**: it lives in `backend/.github/` and GitHub only reads the root `.github/workflows/` |
| Coverage report | none | needs Xdebug or PCOV; see below |

We prefer to be explicit about this: the tests are good at proving **permissions and workflows**; the
gaps are unit tests, frontend tests and a coverage number.

## Running tests

```bash
cd backend
php artisan test                               # everything
php artisan test tests/Feature/TeacherWorkflowTest.php   # one file
php artisan test --filter=test_attendance_can_be_taken_updated_and_reported   # one test
```

Tests use an **in-memory SQLite** database (`phpunit.xml`: `DB_DATABASE=:memory:`), so they never touch your
real data and are fast (about 2–12 seconds for all).

## What the 27 tests cover

| File | Tests | What is proven |
|------|------:|----------------|
| `AdminApiTest` | 7 | Login/logout, inactive users, expired JWT, Super Admin center and admin management, a Center Admin cannot reach Super Admin routes, deactivation and reassignment revoke old tokens, profile fields stored |
| `CenterManagementTest` | 5 | Center Admin endpoints reachable only by Center Admins, teacher CRUD and login, data scoped to own center, students with new/existing guardians and the parent dashboard, subjects/classes/enrolment rules |
| `StudentPortalTest` | 7 | Placeholder students cannot sign in, Center Admin can enable login, class stream and announcements, submit work and see only released results, late/missing work flagged, attendance summary, student portal is for students only |
| `TeacherWorkflowTest` | 5 | Attendance take/update/report, teacher cannot touch other teachers' classes, assignment with questions/YouTube/files, review and grading flow, parent submits for own child only and only until graded |
| `AnnouncementFeedTest` | 1 | Announcements visible only to enrolled students and their parents |
| `ExampleTest` | 1 | Application boots |

The focus is **access control** (who may do what), **data isolation between centers**, and the
**teacher → student → parent workflow**.

## Writing a good feature test

Name = a full sentence in `snake_case`; body = **Arrange → Act → Assert**.

```php
public function test_teacher_cannot_touch_classes_they_do_not_teach(): void
{
    // Arrange: a class this teacher is NOT assigned to (setUp() created $this->teacher)
    $otherClass = Section::create(['center_id' => $this->center->id, 'subject' => 'Art', 'name' => 'Art B', 'status' => 'active']);

    // Act: call the API with the teacher's token
    $response = $this->withToken($this->token)->getJson("/api/v1/teacher/classes/{$otherClass->id}");

    // Assert: behaviour, not implementation
    $response->assertNotFound();
}
```

(Simplified from `TeacherWorkflowTest`.) Tests sign in through a small private `login(User $user)` helper
that calls `POST /api/v1/login` and returns the JWT, then send it with `withToken($token)`. Copy that
helper from `tests/Feature/TeacherWorkflowTest.php` into a new test class. `setUp()` builds a center,
subject, class and one user per role.

### Checklist for every new endpoint

- [ ] **Happy path**: right role, valid data → expected status and JSON
- [ ] **Validation**: missing/invalid field → 422 and the field in `errors`
- [ ] **Permission**: wrong role → 403
- [ ] **Isolation**: another center's or teacher's record → 404
- [ ] **Unauthenticated** → 401 (covered once globally)
- [ ] **Business rule** from the SRS (e.g. capacity, no duplicate attendance)

### Test quality rules

* One behaviour per test; the name says which.
* Assert **outcomes** (status, JSON, database row), not private methods.
* Create only the data the test needs (use the factory, `UserFactory`).
* Tests must not depend on each other or on order.
* Do not use the demo seeder inside tests.

## Measuring coverage (optional)

Coverage needs a driver. Install **PCOV** (`pecl install pcov`) or Xdebug, then:

```bash
php artisan test --coverage          # percentage table
php artisan test --coverage --min=70 # fail if below 70%
```

Record the number in this page when you first measure it.

## Manual test script (smoke test before a demo)

1. Sign in as `center.admin@aspire.test`: dashboard loads; create a student; enrol in a class.
2. Sign in as `nusrat.jahan@aspire.test`: take attendance; create and publish an assignment.
3. Sign in as `ayaan.hossain@aspire.test`: submit the assignment.
4. As the teacher: grade it and release grades.
5. As `karim.hossain@aspire.test` (parent): see the released result.
6. Press `/` on a list page: search focuses. Press `Esc` in a dialog: it closes.

## Frontend tests: suggested start

Add **Vitest** + **React Testing Library**. First candidates: `models/format.js` (pure functions such as
`dueLabel`, `fileSize`), `models/domain.js` (`scheduleText`, `matches`), then `Field` and `ConfirmDialog`.
