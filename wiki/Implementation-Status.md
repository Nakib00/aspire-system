# Implementation Status

The analysis and design documents ([SRS](SRS-Requirements), [Use Cases](Use-Cases),
[SDS](SDS-Design)) describe the **full vision**. The code implements part of it. This page says which part,
so you do not search for code that does not exist yet.

Legend: ✅ built and tested · 🟡 partly built · ⬜ designed only (no code yet)

## By role

### Super Admin

| Capability | Status | Notes |
|------------|--------|-------|
| Sign in / sign out / current user | ✅ | JWT. `AuthController` |
| Create, list, view, update centers | ✅ | `CenterController`. No delete: deactivate with `status`. |
| Create, list, view, update Center Admins | ✅ | `CenterAdminController` |
| Assign / remove a Center Admin's center | ✅ | Removing revokes tokens |
| Activate / deactivate users | ✅ | Through update (`active`) |
| Subjects, levels, worksheets, bulk-assign worksheets | ⬜ | In design (use cases UC-SA-26…46). The implemented model uses *Subjects* and *Classes* per center instead. |
| System-wide reports and dashboard KPIs | ⬜ | UC-SA-58…66 |
| Fees (generate, mark paid, overdue) | ⬜ | Tables exist; no controllers or screens |

### Center Admin

| Capability | Status | Notes |
|------------|--------|-------|
| Dashboard with counts and "needs attention" | ✅ | `Center/DashboardController` |
| Students (with guardians), parents, teachers CRUD | ✅ | `PersonController` family |
| Subjects CRUD | ✅ | |
| Classes CRUD, enrol / unenrol, capacity check | ✅ | Class = `Section` model |
| Enable student login | ✅ | Students normally have no login |
| Attendance monitoring | 🟡 | Teachers record it; the admin view is not built |
| Fees: generate, correct, record payment, overdue | ⬜ | `fees`, `invoices`, `payments` tables only |
| Center and student reports | ⬜ | |

### Teacher

| Capability | Status | Notes |
|------------|--------|-------|
| Dashboard, class list, student list | ✅ | |
| Attendance: take, correct, report | ✅ | Present / late / absent / excused |
| Announcements (create, edit, delete) | ✅ | Text only; file attachment not built |
| Assignments: draft → published → closed, questions, YouTube, attachments | ✅ | |
| Review submissions, grade, feedback, release grades | ✅ | |
| Submit on a student's behalf | ✅ | |
| Notifications to students | ⬜ | `notifications` table exists; nothing sends them |
| Quiz / midterm / final marks and final grade approval | ⬜ | US-T9…T11 |
| Report student issues | ⬜ | US-T13 |
| Audit history of changes | ⬜ | `audit_logs` table and model exist, nothing writes to it |

### Parent and Student

| Capability | Status | Notes |
|------------|--------|-------|
| Parent dashboard, children, switch child | ✅ | |
| Child assignments and submit on behalf (until graded) | ✅ | |
| Student overview, classes, assignments, results, attendance | ✅ | Results visible only after teacher releases them |
| Announcements | ✅ | |
| Invoices, payments, receipts (PDF) | ⬜ | |
| Notification preferences, e-mail | ⬜ | |

## By requirement area

| Area | Status |
|------|--------|
| Authentication, role and section-based access control | ✅ (tested) |
| Data validation on every write | ✅ |
| Private file storage with short-lived signed links | ✅ |
| Audit trail | ⬜ |
| HTTPS / TLS | Deployment concern; not configured in the repo |
| Browser support and responsive layout | 🟡 Responsive CSS present; cross-browser testing not recorded |

## Known gaps worth knowing about

* **Continuous integration is not running.** The workflow files live in `backend/.github/workflows/`,
  but GitHub only runs workflows from the repository root `.github/workflows/`. Moving them there
  (and adding a frontend job) is an open task.
* **Test coverage is not measured.** There are 34 feature tests and 1 unit test, but no coverage report; see [Testing Guide](Testing-Guide).
* **Frontend tests currently cover only Login and the Super Admin workspace:** 8 Vitest/React Testing Library tests (Login 100% lines, Super Admin 56.8%); other roles still need frontend tests. SonarQube was run on this scope; see [Test Results](Test-Results).
* `sections` has both `subject_id` and a text `subject` column that duplicates the subject's name;
  controllers keep them in sync. See [Database](Database). The `api_tokens` table is unused.
