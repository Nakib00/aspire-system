# ASPIRE: After-School Program Integrated Resource & Education System

## Overview

**ASPIRE** (After-School Program Integrated Resource & Education System) is a web-based system for managing the day-to-day operations of an after-school education center. It brings together student enrollment, attendance, assignments, fee and payment management, and parent communication in one platform.

---

## Objectives

- Simplify the administrative work of an education center
- Enable transparent information flow between teachers, parents, and students
- Keep each student's progress visible to everyone involved
- Support managing multiple centers from a single system

---

## User Roles and Responsibilities

| Role                          | Responsibilities                                                                                                                       | Scope                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Super Admin** (Nakib) | Multi-center management, Center Admin management, global financial reports, system analytics, audit and monitoring                     | System-wide control                |
| **Center Admin** (Joy)  | Student, parent, and teacher management, enrollment, attendance monitoring, fee generation, payment and due management, center reports | Single center administration       |
| **Teacher** (Ataur)     | Attendance taking, class material uploads, assignment creation, submission review, grading and feedback, parent notifications          | Classes and student evaluation     |
| **Parent** (Farhana)    | View child's progress, attendance, assignment status, fee invoices, payment records, and notifications                                 | Monitoring their child's education |
| **Student** (Azmann)    | View and submit assignments, download worksheets, view grades and feedback, track personal progress                                    | Personal learning and progress     |

---

## Key Features

- **Multi-center management:** Manage several centers within one system
- **Enrollment and attendance:** Register students and record daily attendance
- **Assignment workflow:** Assign, collect, review, and grade submissions
- **Fee and payment:** Generate invoices, record payments, and track dues
- **Progress tracking:** Make each student's progress visible to teachers, parents, and admins
- **Notifications:** Teachers and centers keep parents informed
- **Reports and analytics:** Center-level and system-level reports

---

## How It Works

Each user logs in with their assigned role and sees only the features permitted for that role. For example, when a teacher records attendance, the Center Admin can monitor it, the parent can view it from their dashboard, and the Super Admin can see it in system-wide reports.

---

## Tech Stack

> Replace this with the technologies your team actually uses, for example:
>
> - **Frontend:** HTML, CSS, JavaScript
> - **Backend:** Node.js / PHP / Django
> - **Database:** MySQL / MongoDB
> - **Version Control:** Git and GitHub
> - **Project Management:** Trello
> - **Communication:** Discord

---

## Academic Context

This project was developed as a Software Engineering course project. It includes SRS and SDS documentation, MVC architecture, unit testing, code review, Git-based version control, and a UI designed according to Nielsen's usability heuristics.

---

## Run Locally

### Requirements

| Tool | Version | Download |
|------|---------|----------|
| PHP | 8.3+ | [php.net/downloads](https://www.php.net/downloads) |
| Composer | 2+ | [getcomposer.org/download](https://getcomposer.org/download) |
| Node.js | 20.19+ or 22.12+ | [nodejs.org](https://nodejs.org) |
| npm | bundled with Node.js | included with Node.js |
| Git | any | [git-scm.com/downloads](https://git-scm.com/downloads) |

### Step 1: Clone the repository

```bash
git clone https://github.com/Nakib00/aspire-system.git
cd aspire-system
```

### Step 2: Run the backend (Laravel API)

Open a terminal in `backend`:

```bash
# Install PHP dependencies
composer install

# Copy environment file (only if .env does not exist)
Copy-Item .env.example .env

# Generate application and JWT keys
php artisan key:generate
php artisan jwt:secret

# Copy the SQLite template database (only if database.sqlite does not exist)
Copy-Item database/aspire-template.sqlite database/database.sqlite

# Run database migrations
php artisan migrate

# Seed the super-admin account
php artisan db:seed

# Start the backend server
php artisan serve
```

Backend runs at: **http://127.0.0.1:8000**

### Step 3: Run the frontend (React + Vite)

Open a **second** terminal in `frontend`:

```bash
# Install Node.js dependencies
npm ci

# Start the development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Step 4: Sign in

Open the frontend URL in your browser and sign in with one of the test accounts below.

### Test Accounts

Use these accounts to test the system:

| Role         | Email                     | Password    |
| ------------ | ------------------------- | ----------- |
| Super Admin  | nakibulislam54@gmail.com  | 12345678    |
| Center Admin | center.admin@aspire.test  | Password123 |
| Teacher      | nusrat.jahan@aspire.test  | Password123 |
| Parent       | karim.hossain@aspire.test | Password123 |
| Student      | ayaan.hossain@aspire.test | Password123 |

> The super-admin account `nakibulislam54@gmail.com` is preserved across system resets.

### Notes

- The backend and frontend must run in **separate terminals**.
- The frontend proxies `/api` to `http://127.0.0.1:8000` automatically.
- On macOS/Linux, replace `Copy-Item` with `cp` and use forward slashes in paths.
- Never commit `.env`, `vendor`, `node_modules`, or the working SQLite database.

---


## Team Members

| Name    | Role in System | GitHub           |
| ------- | -------------- | ---------------- |
| Nakib   | Super Admin    | [@Nakib00](#)     |
| Joy     | Center Admin   | [@Shariar-joy](#) |
| Ataur   | Teacher        | [@ataur451](#)    |
| Farhana | Parent         | [@farhana2443](#) |
| Azmann  | Student        | [@Azmann1402](#)  |
