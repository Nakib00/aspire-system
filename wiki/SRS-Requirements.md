# SRS: Software Requirements Specification

The SRS says **what** the system must do and how well. It follows the usual structure.
Teacher-module requirements are the team's finished set (PDF: [teacher_fr_nfr_ataur.pdf](https://github.com/Nakib00/aspire-system/blob/main/diagram/fr-nfr/teacher_fr_nfr_ataur.pdf)).
Requirements for the other modules are captured in their use-case catalogues ([Use Cases](Use-Cases)).

## 1. Introduction

| | |
|-|-|
| **Purpose** | Define the requirements of ASPIRE for developers, testers and the course evaluators. |
| **Scope** | A web system for after-school education centers: multi-center management, enrolment, attendance, assignments and grading, announcements, fees and payments, parent communication, reports. |
| **Definitions** | See [Glossary](Glossary). |
| **References** | [User Stories](User-Stories), [Use Cases](Use-Cases), [DFD](Data-Flow-Diagrams), [State Diagrams](State-Diagrams), [SDS](SDS-Design). |

## 2. Overall description

* **Product perspective:** a browser-based client (React) talking to a REST API (Laravel) over HTTPS; see [Architecture (MVC)](Architecture-MVC).
* **User classes:** Super Admin, Center Admin, Teacher, Parent, Student ([Project Overview](Project-Overview)). External actors named in the diagrams: Academic Authority, System Administrator, Notification/E-mail service.
* **Operating environment:** modern browsers (Chrome, Firefox, Edge, Safari) on desktop, tablet and phone; server with PHP 8.3+.
* **Constraints:** one codebase, SQLite database, role-based access, private file storage.
* **Assumptions:** each user belongs to exactly one center (except Super Admin); one teacher may teach many classes; a student may attend many classes and have several guardians.

## 3. Functional requirements: Teacher module (FR)

| ID | Requirement | Story | Status |
|----|-------------|-------|--------|
| FR-01 | Teachers log in with email and password, invalid credentials are rejected, and they can log out securely. | US-T1 | ✅ |
| FR-02 | Dashboard shows assigned courses, today's classes, pending tasks and recent notifications. | US-T1 | 🟡 notifications ⬜ |
| FR-03 | Show assigned courses and sections with schedules and enrolled students. | US-T2 | ✅ |
| FR-04 | Prevent access to courses/sections not assigned to the teacher. | US-T2 | ✅ tested |
| FR-05 | Mark students Present, Absent or Late and submit the whole class at once. | US-T3 | ✅ (also Excused) |
| FR-06 | Save attendance with date, section, session, student and status; prevent duplicates for the same student and session. | US-T3 | ✅ unique key |
| FR-07 | Correct submitted attendance and record the change history (previous status, new status, date, editor). | US-T3 | 🟡 correction ✅, history ⬜ |
| FR-08 | View attendance by student, section and date; filter by date range. | US-T4 | ✅ |
| FR-09 | Identify students with repeated absences or late arrivals. | US-T4 | 🟡 per-student totals ✅ |
| FR-10 | Create and publish announcements for assigned sections, with optional attachment. | US-T5 | 🟡 attachment ⬜ |
| FR-11 | Restrict announcements to enrolled students; edit/remove own announcements. | US-T5 | ✅ tested |
| FR-12 | Notify students when an announcement or assignment is published. | US-T6 | ⬜ |
| FR-13 | Send deadline reminders and show delivery status where supported. | US-T6 | ⬜ |
| FR-14 | Create assignments with title, instructions, total marks, due date and optional attachments. | US-T7 | ✅ |
| FR-15 | Save assignments as drafts; only published assignments are visible to students. | US-T7 | ✅ |
| FR-16 | View submitted, late and missing submissions for assigned sections. | US-T8 | ✅ |
| FR-17 | Open/download submitted files; record submission timestamps automatically. | US-T8 | ✅ |
| FR-18 | Permit late submissions or resubmissions when authorised. | US-T8 | 🟡 resubmission replaces; policy switch ⬜ |
| FR-19 | Enter quiz, midterm and final marks per section; store separately per assessment. | US-T9 | ⬜ |
| FR-20 | Validate marks against total marks; review and correct before submission. | US-T9 | ✅ for assignment grades |
| FR-21 | Edit submitted results when permitted and record previous mark, new mark, timestamp, editor. | US-T10 | 🟡 edit ✅, audit ⬜ |
| FR-22 | Require approval for finalized-result corrections; notify students of published changes. | US-T10 | ⬜ |
| FR-23 | Calculate final grades by the approved grading policy; allow review before submission. | US-T11 | ⬜ |
| FR-24 | Show grade statuses Draft, Submitted, Approved, Published; teachers cannot approve their own grades. | US-T11 | ⬜ |
| FR-25 | Give individual feedback linked to the assignment or assessment. | US-T12 | ✅ |
| FR-26 | Make feedback available to the intended student when released; others cannot see it. | US-T12 | ✅ tested |
| FR-27 | Submit issue reports (academic, attendance, behavioural) to the designated authority. | US-T13 | ⬜ |
| FR-28 | Restrict issue reports to authorised users; allow status checks. | US-T13 | ⬜ |
| FR-29 | Dashboard shows upcoming classes, deadlines, pending submissions and results awaiting action. | US-T14 | ✅ |
| FR-30 | Open tasks directly from the dashboard and return to it afterwards. | US-T14 | ✅ |

## 4. Non-functional requirements (NFR)

| ID | Category | Requirement | Status |
|----|----------|-------------|--------|
| NFR-01 | Performance | Dashboard loads and common actions within 3 seconds under normal workload. | Not benchmarked |
| NFR-02 | Performance | Save attendance and marks for a typical section within 3 seconds. | Not benchmarked |
| NFR-03 | Security | Authentication required for protected features; passwords stored with a secure hash. | ✅ JWT + bcrypt |
| NFR-04 | Security | Role-based and section-based access control; session invalidated on logout. | ✅ tested |
| NFR-05 | Security | HTTPS/TLS in deployed environments. | Deployment task |
| NFR-06 | Data integrity | Validate attendance, marks, grades and submissions; consistent records on success or failure. | ✅ validation + transactions |
| NFR-07 | Reliability | Confirm saves, clear error messages, scheduled database backups. | 🟡 messages ✅, backups ⬜ |
| NFR-08 | Usability | Consistent interface; clear labels; loading, success and error states. | ✅ see [UI Design](UI-Design-and-Nielsen-Heuristics) |
| NFR-09 | Compatibility | Chrome, Firefox, Edge, Safari; responsive desktop/tablet/mobile. | 🟡 responsive ✅, cross-browser untested |
| NFR-10 | Auditability | Audit history of attendance and result changes. | ⬜ table exists, not written |
| NFR-11 | Privacy | Restrict student information, private feedback and issue reports by permission. | ✅ tested |
| NFR-12 | Maintainability | Modular architecture, testable critical functions, error logging without sensitive data. | ✅ MVC, 35 tests |
| NFR-13 | Time accuracy | Consistent timestamps in the configured time zone; consistent deadline/late calculation. | ✅ `APP_TIMEZONE=Asia/Dhaka` |

## 5. Requirements for the other modules (summary)

Detailed use cases are in [Use Cases](Use-Cases). In short:

| Module | Requirements area |
|--------|-------------------|
| Super Admin | Authentication; manage users, Center Admins and centers; (design) subjects, levels, worksheets, assignments, attendance, fees, reports |
| Center Admin | Manage students, teachers, parents; link parent/teacher; enrolment; attendance monitoring and correction; monthly fees, payments, overdue; reports |
| Parent | Login and dashboard, switch children; view progress, attendance, assignment status; invoices and receipts; payments; notifications and preferences |
| Student | View classes, assignments, results, attendance; submit work |

## 6. System behaviours as built (rules the code enforces)

These are real, tested rules; keep them when you change the code.

1. Sign-in is limited to 5 attempts per minute; tokens last 60 minutes.
2. A user without a center (except Super Admin), an inactive user, or a placeholder student cannot sign in.
3. Changing a user's active state or center signs them out of every device (`token_version`).
4. A Center Admin sees and edits only their own center's data.
5. A teacher sees only their own classes and assignments.
6. A parent sees only their own children; a student only their own data.
7. A class cannot be enrolled beyond its capacity.
8. One attendance mark per student per class per day.
9. One submission per student per assignment; resubmitting replaces it; a submission after the due time is `late`.
10. A grade is invisible to parents and students unless `published` is true. The teacher's "Release grade to parents" box is ticked by default (the API also defaults to published); an unticked grade stays private until the teacher releases it, singly or with "Release all grades". Marks must be between 0 and the assignment's `max_marks`.
11. A parent can submit for their child only until the work is graded.
12. An assignment with submissions cannot be deleted (close it instead); an assignment may have at most 8 files of ≤ 10 MB (PDF or image).

## 7. Traceability

`User story → Functional requirement → Use case → Test → Code`. Example: US-T3 → FR-05/06 → UC-T03 →
`TeacherWorkflowTest::test_attendance_can_be_taken_updated_and_reported` → `Teacher/AttendanceController` and `views/pages/Attendance.jsx`.
