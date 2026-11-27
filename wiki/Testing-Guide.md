# Testing Guide

## Where we are

| Layer | Tool | Status |
|-------|------|--------|
| Backend API and units | PHPUnit 12 | **35 tests, 354 assertions, all passing** |
| Frontend | Vitest 5 + React Testing Library | **8 tests (3 Login, 5 Super Admin), all passing**; Login 100% lines, Super Admin 56.8% lines |
| Static analysis | SonarQube Community Build | project `aspire-super-admin-login`; see [Testing Results](Test-Results) |
| Continuous integration | GitHub Actions | workflow exists but is **not active**: it lives in `backend/.github/` and GitHub only reads the root `.github/workflows/` |
| Coverage report | frontend only (v8) | PHP coverage needs Xdebug or PCOV; see below |

How to write the tests, and a walkthrough of the Login and Super Admin test code, is in
[Writing Test Cases](Writing-Test-Cases). The latest run, screenshots and Sonar output are in
[Testing Results](Test-Results).

We prefer to be explicit about this: the tests are good at proving **permissions and workflows**; the
remaining gaps are wider frontend coverage and a measured coverage percentage.

## Running tests

```bash
cd backend
php artisan test                               # everything
php artisan test tests/Feature/TeacherWorkflowTest.php   # one file
php artisan test --filter=test_attendance_can_be_taken_updated_and_reported   # one test
```

### Run the Super Admin tests

Run these commands from the repository root:

```bash
cd backend
php artisan test --compact tests/Feature/SuperAdminAuthenticationTest.php tests/Feature/SuperAdminManagementTest.php
```

Run one Super Admin test method while learning or debugging:

```bash
php artisan test --compact --filter=test_valid_credentials_return_a_bearer_token_and_super_admin_details
```

Run the complete backend suite and check PHP formatting before a commit:

```bash
php artisan test --compact
vendor/bin/pint --test
```

On Windows PowerShell, use `vendor\bin\pint.bat --test` if `vendor/bin/pint --test` is not recognized.

Tests use an **in-memory SQLite** database (`phpunit.xml`: `DB_DATABASE=:memory:`), so they never touch your
real data and are fast (about 2–12 seconds for all).

## What the 35 tests cover

| File | Tests | What is proven |
|------|------:|----------------|
| `AdminApiTest` | 7 | Login/logout, inactive users, expired JWT, Super Admin center and admin management, a Center Admin cannot reach Super Admin routes, deactivation and reassignment revoke old tokens, profile fields stored |
| `SuperAdminAuthenticationTest` | 3 | Case-insensitive Super Admin login, JWT response data, login timestamp, required-field validation, and wrong-password rejection |
| `SuperAdminManagementTest` | 5 | Center creation and generated code, alphabetical center listing, normalized Center Admin email, password-change token revocation, and rejecting non-Center-Admin records |
| `CenterManagementTest` | 5 | Center Admin endpoints reachable only by Center Admins, teacher CRUD and login, data scoped to own center, students with new/existing guardians and the parent dashboard, subjects/classes/enrolment rules |
| `StudentPortalTest` | 7 | Placeholder students cannot sign in, Center Admin can enable login, class stream and announcements, submit work and see only released results, late/missing work flagged, attendance summary, student portal is for students only |
| `TeacherWorkflowTest` | 5 | Attendance take/update/report, teacher cannot touch other teachers' classes, assignment with questions/YouTube/files, review and grading flow, parent submits for own child only and only until graded |
| `AnnouncementFeedTest` | 1 | Announcements visible only to enrolled students and their parents |
| `ExampleTest` | 1 | Application boots |
| `Unit/ExampleTest` | 1 | Basic PHPUnit unit-test setup works |

The focus is **access control** (who may do what), **data isolation between centers**, and the
**teacher → student → parent workflow**.

## Super Admin tests explained

These are Laravel **feature tests**, even though people often call all automated tests "unit tests." A
feature test is correct here because it exercises the route, validation, controller, JWT authentication
and database together, just like an API client.

### Authentication tests

| Test | Expected result | Why it matters |
|------|-----------------|----------------|
| Valid credentials | `200`, Bearer JWT and Super Admin profile | Proves a Super Admin without a center can sign in |
| Uppercase email | Login succeeds and resolves the lowercase account | Proves login email matching is case-insensitive |
| Successful login | `last_login_at` is saved | Proves the audit timestamp is updated |
| Missing email/password | `422` with both validation errors | Proves invalid requests are explained to the client |
| Wrong password | `401`; login time remains empty | Proves failed authentication does not change account state |

### Management API tests

| Test | Expected result | Why it matters |
|------|-----------------|----------------|
| Create center | `201`, saved row and generated `CTR-001` code | Checks both the JSON response and database |
| List centers | `200`, names in alphabetical order | Proves the API's documented ordering |
| Create Center Admin | `201`, role and center saved, email lowercased | Protects account consistency |
| Change Center Admin password | Old JWT gets `401`; new password can log in | Proves a security-sensitive change revokes old sessions |
| Request a teacher through Center Admin endpoint | `404` | Prevents the endpoint from exposing the wrong user type |

### How one test works

Every test uses **Arrange -> Act -> Assert**:

```php
// Arrange: create only the data required by this test.
$superAdmin = User::factory()->create([
    'email' => 'owner@example.com',
    'password' => 'password123',
    'role' => 'super_admin',
    'active' => true,
]);

// Act: call the real login API.
$response = $this->postJson('/api/v1/login', [
    'email' => 'OWNER@EXAMPLE.COM',
    'password' => 'password123',
]);

// Assert: check the observable API result.
$response->assertOk()
    ->assertJsonPath('token_type', 'Bearer')
    ->assertJsonPath('user.role', 'super_admin');
```

`LazilyRefreshDatabase` gives the tests an isolated database. `phpunit.xml` sets that database to
SQLite `:memory:`, so the records disappear after the test run and development data is never changed.

## Latest verified result

Verified on **27 November 2026**:

```text
Focused Super Admin suite
8 tests passed, 43 assertions

Complete backend suite
35 tests passed, 354 assertions

Laravel Pint formatting
Passed

Frontend Super Admin suite
5 tests passed in 1 test file

Frontend lint and production build
Passed
```

The focused run initially exposed a test expectation mismatch: Laravel's raw paginator puts `total` at
the JSON root, not under `meta`. The assertion was corrected to match the API's real response, then both
the focused and complete suites passed.

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

## Frontend Super Admin tests

The frontend suite uses Vitest, React Testing Library, `user-event` and jsdom. API functions are mocked,
so these tests are fast, deterministic and do not need the Laravel server or a real database.

Run all frontend tests from the repository root:

```bash
cd frontend
npm test
```

Useful alternatives:

```bash
npm run test:watch                                      # rerun while editing
npm test -- --run src/views/pages/SuperAdmin.test.jsx  # Super Admin file only
npm run lint                                            # JavaScript quality check
npm run build                                           # production build check
```

The eight tests prove that:

| Test file | Test | What it proves |
|-----------|------|----------------|
| `Login.test.jsx` | Submit credentials | The form posts email and password to `/login` and passes the session to the app |
| `Login.test.jsx` | Failed login | The API message is shown in an alert, no session is created, and the button is re-enabled |
| `Login.test.jsx` | Show and hide password | The password field toggles between hidden and visible text |
| `SuperAdmin.test.jsx` | Dashboard totals | Centers, administrators, capacity and attention items are calculated and shown |
| `SuperAdmin.test.jsx` | Center search | Typing a center name hides non-matching rows |
| `SuperAdmin.test.jsx` | Administrator safety rule | A new Center Admin cannot be created until an active center exists |
| `SuperAdmin.test.jsx` | Expired JWT | A `401` API response signs the Super Admin out |
| `SuperAdmin.test.jsx` | Loading failure | A clear error and **Try again** action are shown |

The test files are `frontend/src/views/pages/Login.test.jsx` and `frontend/src/views/pages/SuperAdmin.test.jsx`.
Shared DOM assertions and cleanup live in `frontend/src/test/setup.js`; the jsdom environment is
configured in `frontend/vite.config.js`. Step-by-step explanation of this code: [Writing Test Cases](Writing-Test-Cases).

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
