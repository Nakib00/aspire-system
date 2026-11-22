# Data Flow Diagrams (DFD)

A DFD shows **how data moves**: who sends data in (external entities), what transforms it (processes),
and where it rests (data stores). Notation used here: rectangles = external entities, rounded boxes =
processes, cylinders = data stores, arrows = data flows.

PDF sources (in `diagram/` on `main`):

| Module | File |
|--------|------|
| Super Admin | [Context diagram](https://github.com/Nakib00/aspire-system/blob/main/diagram/data_flow_diagram/super_admin_nakib/Data%20Flow%20Diagrams%201.pdf) · [Level 0](https://github.com/Nakib00/aspire-system/blob/main/diagram/data_flow_diagram/super_admin_nakib/Data%20Flow%20Diagrams%202.pdf) |
| Center Admin | [Level 0 with flow table DF-01…DF-24](https://github.com/Nakib00/aspire-system/blob/main/diagram/center_admin/Data%20Flow%20Diagram.pdf) |
| Teacher | [Level 0](https://github.com/Nakib00/aspire-system/blob/main/diagram/data_flow_diagram/Teacher_Ataur/DFD_Level0_Teacher_Ataur.pdf) |
| Parent | [Level 0](https://github.com/Nakib00/aspire-system/blob/main/diagram/data_flow_diagram/parent_farhana/DFD0_Parent_Farhana.drawio.pdf) |

The diagrams below re-draw the content of those PDFs as text diagrams so they can be read and reviewed in the wiki.

## Level 0: Super Admin (context)

The Super Admin exchanges data with one system. Flows named in the diagram: login credentials → **JWT token and profile**;
user, center-admin and parent lists; center records and statistics; subject/level lists and worksheet files;
teacher/student records and enrolment numbers; assignment and submission lists and files; attendance history and
summaries; fee records, outstanding fees and summaries; dashboard KPIs and reports.

```mermaid
flowchart LR
    SA[Super Admin] -- "credentials, requests, data" --> S((ASPIRE system))
    S -- "JWT, profile, lists, records, KPIs, reports" --> SA
    S <--> DB[(Database)]
```

## Level 0: Center Admin (5 processes, 4 stores)

| Store | Content |
|-------|---------|
| D1 | People and center records |
| D2 | Attendance |
| D3 | Fees |
| D4 | Learning results |

```mermaid
flowchart LR
    CA[Center Admin]
    P1(1.0 Manage users and account access)
    P2(2.0 Manage student enrollment)
    P3(3.0 Monitor and maintain attendance)
    P4(4.0 Manage monthly fees and payment records)
    P5(5.0 Generate center and student reports)
    D1[(D1 People and center)]
    D2[(D2 Attendance)]
    D3[(D3 Fees)]
    D4[(D4 Learning results)]
    CA -- "credentials, profile, user data" --> P1 -- "session, user records" --> CA
    CA -- "student details, parent/teacher IDs" --> P2 -- "enrolment number, student records" --> CA
    CA -- "month, student, attendance entries" --> P3 -- "history, status totals" --> CA
    CA -- "billing month, fee edits, payments" --> P4 -- "fee records, statuses, totals" --> CA
    CA -- "report selections" --> P5 -- "financial, academic, attendance figures" --> CA
    P1 <--> D1
    P2 <--> D1
    P3 <--> D2
    P3 --> D1
    P4 <--> D3
    P4 --> D1
    P5 --> D1 & D2 & D3 & D4
```

## Level 0: Teacher

| Entity | Sends to the Teacher Module | Receives |
|--------|----------------------------|----------|
| Teacher | Login credentials, attendance, announcements, assignments, marks, feedback, issue reports | Dashboard, class schedule, student lists, submissions, pending tasks, notifications |
| Student | Assignment submissions | Announcements, assignments, feedback, published grades, notifications |
| Academic Authority | Approval and publish decisions | Grades for approval, issue reports, correction requests |
| System Administrator | Courses, sections, teacher assignments, enrolment, permissions | n/a |
| Notification Service | Delivery status | Notification and reminder requests |

```mermaid
flowchart LR
    T[Teacher] -- "credentials, attendance, announcements, assignments, marks, feedback, issue reports" --> M((0 Teacher Module))
    M -- "dashboard, schedule, student lists, submissions, pending tasks" --> T
    ST[Student] -- "submissions" --> M
    M -- "announcements, assignments, feedback, published grades" --> ST
    AA[Academic Authority] -- "approval and publish decisions" --> M
    M -- "grades for approval, issue reports, correction requests" --> AA
    SYS[System Administrator] -- "courses, sections, enrolment, permissions" --> M
    M -- "notification and reminder requests" --> N[Notification Service]
    N -- "delivery status" --> M
```

## Level 0: Parent

```mermaid
flowchart LR
    P[Parent] -- "login, child selection, notification preferences, download requests" --> S((ASPIRE system))
    S -- "dashboard, progress, attendance, assignments, invoices, payments, receipts, notifications" --> P
    T[Teacher] -- "attendance, grades, feedback, announcements" --> S
    ST[Student] -- "assignment submissions" --> S
    CA[Center Admin] -- "invoices, payments, parent-child link" --> S
    S -- "notification emails" --> E[Email Service]
```

## As-built data flow (derived from the code)

This diagram is **not** one of the original PDFs. It shows what the implemented system actually does today.

```mermaid
flowchart LR
    SA[Super Admin] -- "centers, center admins" --> API((Laravel API))
    CA[Center Admin] -- "people, subjects, classes, enrolment" --> API
    TE[Teacher] -- "attendance, announcements, assignments, grades" --> API
    PA[Parent] -- "child submissions" --> API
    ST[Student] -- "submissions" --> API
    API <--> DB[(SQLite: users, centers, sections, attendance_records, assignments, submissions, grades, announcements)]
    API <--> FS[(Private file storage)]
    API -- "dashboards, lists, released grades, signed file links" --> SA & CA & TE & PA & ST
```

## How to read and draw a DFD

1. Level 0 (context): one process, all external entities, the main flows.
2. Level 1: split the process into 3–7 numbered sub-processes (1.0, 2.0 …) and add data stores (D1, D2 …).
3. Every flow is a **noun phrase** (what data), never a verb.
4. Data never flows directly between two stores or two external entities; it always passes a process.
5. Number the flows (DF-01 …) and list them in a table as the Center Admin document does.
