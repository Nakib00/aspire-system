# API Reference

Base URL (local): `http://127.0.0.1:8000/api/v1`. During frontend development use `/api/v1` (the Vite dev
server forwards it). All bodies are JSON unless a file is uploaded (`multipart/form-data`).

Send `Accept: application/json` and, after sign-in, `Authorization: Bearer <token>`.
Response and error shapes are on [Authentication and Roles](Authentication-and-Roles).

> This list is generated from `php artisan route:list --path=api`. Run that command for the latest.
> `{id}` placeholders are numeric ids. "REST" means the five standard actions: list `GET`, create `POST`, show `GET /{id}`, update `PUT|PATCH /{id}`, delete `DELETE /{id}`.

## Public

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/login` | Body `{ email, password }` → `{ token, token_type, expires_in, user }`. 5 tries/minute. |
| GET | `/files/attachments/{attachment}` | Stream an assignment file. Needs a **signed URL**, not a token. |
| GET | `/files/submissions/{submission}` | Stream a submitted file. Signed URL. |

## Any signed-in user

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Current user with center. |
| POST | `/logout` | Revoke the current token. |

## Super Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET, POST | `/centers` | List (paginated, 20) / create a center. |
| GET, PUT\|PATCH | `/centers/{center}` | Show / update. There is no delete; set `status` to `inactive`. |
| GET, POST | `/center-admins` | List / create Center Admins. |
| GET, PUT\|PATCH | `/center-admins/{center_admin}` | Show / update (name, email, password, `active`, `center_id`). |
| DELETE | `/center-admins/{centerAdmin}/center` | Unassign the admin from their center and revoke their tokens. |

## Center Admin (`/center/...`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/center/dashboard` | Counts, today's classes, "needs attention", enrolment by subject. |
| REST | `/center/students` | Students. Create accepts `guardians[]` (new or existing parent). |
| POST | `/center/students/{student}/guardians` | Link a parent to a student. |
| DELETE | `/center/students/{student}/guardians/{parent}` | Unlink. |
| REST | `/center/parents` | Parents (`student_ids[]` links children). |
| REST | `/center/teachers` | Teachers. |
| REST | `/center/subjects` | Subjects. |
| REST | `/center/classes` | Classes (sections): schedule, room, capacity, `teacher_ids[]`. |
| POST | `/center/classes/{class}/students` | Enrol `student_ids[]`; fails with 422 when capacity is exceeded. |
| DELETE | `/center/classes/{class}/students/{student}` | Remove a student from a class. |

## Teacher (`/teacher/...`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/teacher/dashboard` | Today's classes, submissions to review, upcoming deadlines. |
| GET | `/teacher/classes` | My classes. |
| GET | `/teacher/classes/{class}` | One class with students. |
| GET | `/teacher/classes/{class}/attendance?date=YYYY-MM-DD` | Attendance sheet for a day. |
| PUT | `/teacher/classes/{class}/attendance` | Save attendance for every student for a day. |
| GET | `/teacher/classes/{class}/attendance/report?from=&to=` | Per-day and per-student totals. |
| GET, POST | `/teacher/classes/{class}/announcements` | List / post. |
| PATCH, DELETE | `/teacher/announcements/{announcement}` | Edit / delete my announcement. |
| REST | `/teacher/assignments` | Assignments (filter list with `section_id`, `status`). |
| POST | `/teacher/assignments/{assignment}/attachments` | Upload PDF/image (≤ 10 MB, max 8 files). Field name `file`. |
| DELETE | `/teacher/assignments/{assignment}/attachments/{attachment}` | Remove a file. |
| GET | `/teacher/assignments/{assignment}/submissions` | Roster: every student with submission and grade. |
| POST | `/teacher/assignments/{assignment}/students/{student}/submission` | Record work on a student's behalf. |
| GET | `/teacher/submissions/{submission}` | One submission (marks it opened). |
| PUT | `/teacher/submissions/{submission}/grade` | Set marks and feedback. |
| DELETE | `/teacher/submissions/{submission}/grade` | Remove the grade. |
| POST | `/teacher/assignments/{assignment}/grades/publish` | Release all graded submissions to parents and students. |

## Parent and Student portals

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET | `/portal/parent` | Parent | Children, their classes, recent attendance. |
| GET | `/portal/parent/children/{child}/assignments` | Parent | A child's published work and released grades. |
| POST | `/portal/parent/children/{child}/assignments/{assignment}/submission` | Parent | Submit for a child (until graded). |
| GET | `/portal/announcements` | Parent, Student | Announcements of the child's/own classes (pinned first). |
| GET | `/portal/teacher` | Teacher | Classes taught and who is enrolled. |
| GET | `/portal/student/overview` | Student | Stats, due soon, missing, announcements, recent results. |
| GET | `/portal/student/classes` | Student | My classes. |
| GET | `/portal/student/classes/{class}` | Student | One class: teachers, announcements, assignments, attendance. |
| GET | `/portal/student/assignments` | Student | All assignments (to-do). |
| POST | `/portal/student/assignments/{assignment}/submission` | Student | Submit or replace my work. Fields `file`, `text_answer`. |
| GET | `/portal/student/results` | Student | Released grades. |
| GET | `/portal/student/attendance` | Student | Attendance history and totals. |

## Example: sign in and call the API

```bash
# 1. sign in
curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"nusrat.jahan@aspire.test","password":"Password123"}'

# 2. use the token from the answer
curl -s http://127.0.0.1:8000/api/v1/teacher/dashboard \
  -H "Accept: application/json" -H "Authorization: Bearer <paste-token-here>"
```

## Adding an endpoint: steps

1. Add the route to the right file in `backend/routes/` (`api-teacher.php`, …).
2. Add the method to the controller; start with the scoped helper (`$this->myClass($request, $id)`).
3. Validate with `$request->validate([...])`; return `response()->json(['data' => ...])`.
4. Write a feature test (see [Testing Guide](Testing-Guide)).
5. Add a PHPDoc block with the HTTP route.
6. Update this page.
