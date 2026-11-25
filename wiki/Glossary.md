# Glossary

| Term | Meaning in ASPIRE |
|------|-------------------|
| **Center** | One after-school education center (a tenant). All data except Super Admin accounts belongs to one center. |
| **Section / Class** | A subject taught to a group of students on certain days and times. Code: `Section`; UI and URLs: "class". |
| **Subject** | What is taught (Mathematics, English). A center owns its subjects. |
| **Enrolment** | Linking a student to a class (`section_student`). Limited by class capacity. |
| **Guardian** | A parent linked to a student (`parent_student`, with a relationship such as "Mother"). |
| **Assignment** | Homework set by a teacher for a class. Status: draft → published → closed. |
| **Submission** | A student's answer to an assignment (text and/or file). One per student; resubmitting replaces it. |
| **Grade** | Marks and feedback on a submission. Visible to families only when `published` is true. The grading form's "Release grade to parents" box is ticked by default; unticked grades stay private until released. |
| **Late** | A submission made after `due_at`. |
| **Missing** | A published, past-due assignment without a submission. |
| **Announcement** | A message from a teacher to one class. Pinned ones show first. |
| **Attendance status** | `present`, `late`, `absent` or `excused`, one per student per class per day. |
| **Placeholder student** | A student created without a login (email ending `@students.aspire.local`). |
| **Workspace** | The role-specific part of the React app (Teacher workspace, …). |
| **Portal** | Workspace for parents and students. |
| **JWT** | JSON Web Token: the signed string the browser sends as `Authorization: Bearer …` to prove who it is. |
| **`token_version`** | Number on a user; bumping it invalidates all their existing tokens. |
| **Signed URL** | A temporary link to a private file that works without a token. |
| **Scoped controller** | A base controller that limits every query to the caller's center or classes. |
| **Migration** | A PHP file that changes the database schema in a repeatable way. |
| **Seeder** | A PHP class that inserts starting data. |
| **Eloquent** | Laravel's object-relational mapper: each table is a model class. |
| **Feature test** | A PHPUnit test that calls the API like a client and checks the response. |
| **MVC** | Model–View–Controller: split data, presentation and control logic. See [Architecture (MVC)](Architecture-MVC). |
| **SRS** | Software Requirements Specification: what the system must do. See [SRS](SRS-Requirements). |
| **SDS** | Software Design Specification: how it is built. See [SDS and Class Diagrams](SDS-Design). |
| **DFD** | Data Flow Diagram. |
| **FR / NFR** | Functional / Non-Functional Requirement. |
| **UC / US** | Use Case / User Story, followed by a role letter and number (UC-T03, US-T3). |
| **PR** | Pull request: a proposed change on GitHub that others review before merging. |
| **Pint** | Laravel's PHP code-style fixer. |
| **oxlint** | The JavaScript linter we use. |
| **Skeleton** | Grey placeholder rows shown while data loads. |
| **Toast** | A small message at the bottom of the screen confirming or reporting an action. |
