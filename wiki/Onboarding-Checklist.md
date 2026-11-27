# Onboarding Checklist

Tick these off in your first week. Each step links to the page that explains it.

## Day 1: run it

- [ ] Install the tools and clone the repo ([Getting Started](Getting-Started))
- [ ] Backend runs; `php artisan test` shows **35 passed**
- [ ] Frontend runs; you can sign in as each demo role
- [ ] You clicked through every role's screens once
- [ ] Read [Project Overview](Project-Overview) and [Implementation Status](Implementation-Status)

## Day 2: understand it

- [ ] Read [Architecture (MVC)](Architecture-MVC) and [Folder Structure](Folder-Structure)
- [ ] Read [Database](Database); open `database.sqlite` in a viewer and look at `users`, `sections`
- [ ] Read [Authentication and Roles](Authentication-and-Roles)
- [ ] Run `php artisan route:list --path=api` and match a few lines with [API Reference](API-Reference)
- [ ] Follow one request end to end: *teacher saves attendance* → `api-teacher.php` → `AttendanceController@store` → `AttendanceRecord` → React `Attendance.jsx`

## Day 3: learn the rules

- [ ] Read [Coding Standards and Naming](Coding-Standards-and-Naming) and [Source Code Documentation](Source-Code-Documentation)
- [ ] Read [Git Workflow and Code Review](Git-Workflow-and-Code-Review)
- [ ] Read [Testing Guide](Testing-Guide) and open `TeacherWorkflowTest.php`
- [ ] Skim [User Stories](User-Stories), [SRS](SRS-Requirements) and [Use Cases](Use-Cases) for the role you will work on

## Day 4–5: your first change

Pick a **small** task and walk the full loop:

| Suggested starter task | Skills practised |
|------------------------|------------------|
| Add a missing doc block or fix a typo in the wiki | Git, PR |
| Add a test for a missing permission case | Testing |
| Show a new field in a list (e.g. teacher `qualification`) | API + React |
| Add a format helper (`models/format.js`) with a test idea | Frontend model layer |

- [ ] Branch → change → `pint` / `test` / `lint` / `build` → commit → push → pull request
- [ ] A teammate reviewed it and you answered every comment
- [ ] It was merged and your branch deleted

## Where to find things fast

| I want to… | Look at |
|------------|---------|
| Know what a word means | [Glossary](Glossary) |
| Fix a setup error | [Troubleshooting and FAQ](Troubleshooting-and-FAQ) |
| See what the customer asked for | [User Stories](User-Stories), [SRS](SRS-Requirements) |
| See the design | [SDS and Class Diagrams](SDS-Design), [Document Index](Document-Index) |
| Know what is built and what is not | [Implementation Status](Implementation-Status) |
