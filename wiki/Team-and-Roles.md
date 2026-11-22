# Team and Roles

ASPIRE is built by a student team for CSE451 (Software Engineering Concepts). Each member owns one
user role end to end: analysis documents, backend, frontend and tests for that role.

| Member | Module owned | Branch | Main documents |
|--------|--------------|--------|----------------|
| **Nakib** | Super Admin | `super-admin-nakib` | Use case figures 1–5, DFD level 0, state diagrams, class diagram (`diagram/*/super_admin_nakib`, `uml_diagram`) |
| **Joy** | Center Admin | `centeradmin-joy` | Class, DFD, state and use case diagrams (`diagram/center_admin`) |
| **Ataur** | Teacher | `teacher-ataur` | User stories, FR/NFR, use case diagram and narratives, DFD (`diagram/*teacher*`) |
| **Farhana** | Parent | `parent-farhana` | Use case diagram and narratives, DFD, invoice and notification state diagrams |
| **Azmann** | Student | n/a | Student portal role (implemented in the Student workspace) |

## Working agreements

* Work on your own branch; merge through pull requests ([Git Workflow and Code Review](Git-Workflow-and-Code-Review)).
* Ask for a review from a teammate who owns the **neighbouring** module: the teacher flow touches students and parents, so those owners should look.
* Changing a shared file (`ui.jsx`, `shared.jsx`, `models/api.js`, a base controller): tell the team in your PR description.
* Update the wiki in the same PR when your change affects setup, the database or the API.

## Who to ask

| Question about | Ask |
|----------------|-----|
| Centers, Center Admin accounts, authentication | Nakib |
| Students, parents, teachers, subjects, classes | Joy |
| Attendance, assignments, grading, announcements | Ataur |
| Parent portal, invoices, notifications | Farhana |
| Student portal | Azmann |
