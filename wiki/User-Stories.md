# User Stories

A user story says **who** wants **what** and **why**, and the **acceptance criteria** say when it is done.
Format: *As a \<role\>, I want \<goal\>, so that \<benefit\>.*

Source documents (PDF in Git): [Teacher user stories](https://github.com/Nakib00/aspire-system/blob/main/diagram/user-stories/teacher_ataur_user_stories.pdf).
Each story links to its functional requirements in the [SRS](SRS-Requirements) and its use case in [Use Cases](Use-Cases).

> **Status of this page.** The Teacher stories (US-T1 … US-T14) are the team's official, reviewed set.
> The other roles have use-case catalogues but no story PDF yet, so stories for them are listed in the last
> section as **proposed**, derived from their use cases, until the owners approve them.

---

## Teacher (owner: Ataur): official

### US-T1: Teacher login and dashboard
*As a teacher, I want to log in to my account and see my dashboard, so that I can easily manage my classes and daily tasks.*
**Acceptance criteria**
* A teacher can log in with a valid email and password.
* The dashboard shows assigned courses, today's classes, pending tasks and recent notifications.
* The teacher can log out securely.

Use case: UC-T01 · Requirements: FR-01, FR-02 · Built: ✅ (notifications panel ⬜)

### US-T2: Select course and section
*As a teacher, I want to select my assigned course and section according to the class schedule, so that I can access the correct student list and classroom activities.*
* Teacher sees only courses/sections assigned to them, with the schedule and enrolled students.
* Teacher cannot access sections not assigned to them.

UC-T02 · FR-03, FR-04 · ✅

### US-T3: Take class attendance
*As a teacher, I want to mark students as present, absent or late, so that I can keep an accurate record of class attendance.*
* Mark the whole class and submit at once.
* The system saves date, class section and student status.
* Corrections after submission are allowed if permitted, and the change is recorded.
* No duplicate attendance record for the same class session.

UC-T03 · FR-05, FR-06, FR-07 · ✅ (change history ⬜)

### US-T4: View and update attendance records
*As a teacher, I want to check previous attendance records, so that I can identify students who are frequently absent or late.*
* View attendance by student, section and date; filter by date range.
* Students with repeated absences are easy to identify.

UC-T04 · FR-08, FR-09 · ✅ (attendance report)

### US-T5: Post classroom announcements
*As a teacher, I want to post announcements for my class, so that students stay informed about updates, exam dates and notices.*
* Write and post to an assigned section; optionally attach a file.
* Only students of that section can view it.
* Edit or remove your own announcement.

UC-T05 · FR-10, FR-11 · ✅ (file attachment ⬜)

### US-T6: Notify students
*As a teacher, I want to notify students about important class activities, so that they do not miss deadlines, exams or updates.*
* Students are notified when an announcement or assignment is published; reminders for deadlines; delivery status where supported.

UC-T06 · FR-12, FR-13 · ⬜

### US-T7: Assign assignments
*As a teacher, I want to create and assign homework, so that students know what to complete and when to submit.*
* Add title, instructions, total marks and due date; attach worksheets.
* Save as draft before publishing; only published assignments are visible to students.

UC-T07 · FR-14, FR-15 · ✅

### US-T8: Review student submissions
*As a teacher, I want to view students' submitted assignments in one place, so that I can check their work without opening each profile.*
* View submitted, late and missing work; open or download files; submission time recorded automatically.
* Allow late submission or resubmission when necessary.

UC-T08 · FR-16, FR-17, FR-18 · ✅ (late-permission switch ⬜)

### US-T9: Record quiz marks and exam results
*As a teacher, I want to record marks for quizzes, midterm and final exams, so that performance is recorded.*
* Enter marks per section; marks cannot exceed total; review and correct before submitting; stored separately per assessment.

UC-T09 · FR-19, FR-20 · 🟡 (assignment grading ✅; separate exam records ⬜)

### US-T10: Edit submitted results
*As a teacher, I want to correct a result when I find a marking error, so that records stay accurate.*
* Edit with permission; system records previous mark, new mark, date and editor; finalized results may need approval; students notified of published changes.

UC-T10 · FR-21, FR-22 · 🟡 (grade can be replaced; audit and approval ⬜)

### US-T11: Submit final grades
*As a teacher, I want to calculate and submit final grades, so that results can be reviewed and published by the university.*
* Grades calculated by the approved policy; draft/submitted/approved/published status; a teacher cannot approve their own grades.

UC-T11 · FR-23, FR-24 · ⬜

### US-T12: Provide feedback to students
*As a teacher, I want to give feedback on assignments and results, so that students understand their mistakes.*
* Individual feedback linked to the assignment; visible when released; private to that student.

UC-T12 · FR-25, FR-26 · ✅

### US-T13: Collect student issues
*As a teacher, I want to report serious academic, attendance or behavioural issues to the proper authority, so that students get support.*
* Report with student details and description; sent to the designated authority; only authorised people can read it; status trackable.

UC-T13 · FR-27, FR-28 · ⬜

### US-T14: View class schedule
*As a teacher, I want to see my upcoming classes, pending grading and unfinished tasks, so that I can plan my work.*
* Dashboard shows upcoming classes and deadlines; pending submissions listed; tasks open directly from the dashboard.

UC-T14 · FR-29, FR-30 · ✅

---

## Proposed stories for the other roles

> Derived from the use-case catalogues. **Pending approval by the module owner.**

### Super Admin (Nakib)
* **US-SA1** As a Super Admin, I want to create and update centers, so that every after-school center is registered with correct details. *(UC-SA-10…14, ✅ create/update/view)*
* **US-SA2** As a Super Admin, I want to create Center Admin accounts and assign them to a center, so that each center has someone to run it. *(UC-SA-01, UC-SA-07, ✅)*
* **US-SA3** As a Super Admin, I want to deactivate an account, so that people who left cannot sign in. *(UC-SA-06, ✅)*
* **US-SA4** As a Super Admin, I want system-wide reports and KPIs, so that I can monitor all centers. *(UC-SA-58…66, ⬜)*

### Center Admin (Joy)
* **US-CA1** As a Center Admin, I want to register students, parents and teachers, so that my center's people are in the system. *(UC-CA-03, ✅)*
* **US-CA2** As a Center Admin, I want to link a parent to a student and enrol the student in classes, so that families see the right information. *(UC-CA-04, UC-CA-05, ✅)*
* **US-CA3** As a Center Admin, I want a dashboard showing what needs attention, so that gaps (no teacher, no guardian) are fixed quickly. *(UC-CA-02, ✅)*
* **US-CA4** As a Center Admin, I want to generate monthly fees and record payments, so that dues are tracked. *(UC-CA-09…12, ⬜)*

### Parent (Farhana)
* **US-P1** As a parent, I want to sign in and see my children, so that I can follow each child's progress. *(UC-P1, ✅)*
* **US-P2** As a parent, I want to see attendance and assignment status, so that I can help my child on time. *(UC-P3, UC-P4, ✅)*
* **US-P3** As a parent, I want to see invoices and payments, so that I know what is due. *(UC-P5, UC-P6, ⬜)*
* **US-P4** As a parent, I want notifications about important events, so that I do not miss anything. *(UC-P7, ⬜)*

### Student (Azmann)
* **US-S1** As a student, I want to see my classes and assignments, so that I know what to do. *(✅)*
* **US-S2** As a student, I want to submit work as text or a file before the deadline, so that my teacher can grade it. *(✅)*
* **US-S3** As a student, I want to read my grades and feedback once released, so that I can improve. *(✅)*

## Writing a new story: template

```
### US-<role letter><n>: <short title>
As a <role>, I want <goal>, so that <benefit>.
Acceptance criteria
* <observable, testable condition>
* <another>
Use case: UC-... · Requirements: FR-... · Test: <test name>
```

Good acceptance criteria are **testable** ("the system prevents duplicate attendance records"), not vague ("easy to use").
