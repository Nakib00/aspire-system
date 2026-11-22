# Getting Started

This page takes you from an empty computer to a running ASPIRE on your own machine. Allow 20–30 minutes.

ASPIRE is **two programs** that run side by side:

| Program | Folder | What it does | Address |
|---------|--------|--------------|---------|
| Backend (API) | `backend/` | Laravel. Stores data, enforces rules. | http://127.0.0.1:8000 |
| Frontend (website) | `frontend/` | React + Vite. What people see. | http://localhost:5173 |

You need **two terminal windows**, one per program.

---

## 1. Install the tools

| Tool | Version | Why you need it | Download |
|------|---------|-----------------|----------|
| Git | any recent | Get and share the code | https://git-scm.com/downloads |
| PHP | **8.3 or newer** (8.5 is used by the team) | Runs the backend | https://www.php.net/downloads |
| Composer | 2.x | Installs PHP libraries | https://getcomposer.org/download |
| Node.js | **20.19+ or 22.12+** (includes `npm`) | Runs the frontend | https://nodejs.org |
| A code editor | VS Code recommended | Editing | https://code.visualstudio.com |

### PHP extensions

SQLite is the database, so PHP needs these extensions enabled: `pdo_sqlite`, `sqlite3`, `mbstring`,
`openssl`, `fileinfo`, `curl`, `zip`, `xml`/`dom`, `ctype`, `tokenizer`.

* **Windows:** open `php.ini` (run `php --ini` to find it) and remove the `;` in front of each
  `extension=...` line above, then save.
* **macOS (Homebrew):** `brew install php composer node` (extensions are included).
* **Ubuntu/Debian:** `sudo apt install php php-cli php-sqlite3 php-mbstring php-xml php-curl php-zip unzip composer nodejs npm`

### Check your install

```bash
git --version
php -v            # must say 8.3 or higher
php -m | grep -i sqlite   # (Windows PowerShell: php -m | Select-String sqlite)  must list pdo_sqlite and sqlite3
composer -V
node -v           # 20.19+ or 22.12+
npm -v
```

If any command is "not found", close and reopen the terminal, or add the tool to your `PATH`.

---

## 2. Get the code

```bash
git clone https://github.com/Nakib00/aspire-system.git
cd aspire-system
```

Create your own working branch right away (see [Git Workflow and Code Review](Git-Workflow-and-Code-Review)):

```bash
git switch -c feature/<short-name>
```

---

## 3. Run the backend (terminal 1)

```bash
cd backend

# 1. Install PHP libraries
composer install

# 2. Create your private settings file
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env

# 3. Generate the two secret keys
php artisan key:generate
php artisan jwt:secret

# 4. Create an empty database file
touch database/database.sqlite  # PowerShell: New-Item database/database.sqlite -ItemType File

# 5. Create all tables
php artisan migrate

# 6. Start the API
php artisan serve
```

Open http://127.0.0.1:8000/api/v1/me in a browser. A JSON message `{"message":"Unauthenticated."}` means
the backend works.

### Create your first account

You can load ready-made **demo data** (recommended while learning), or create only a Super Admin.

**Option A: demo data (all five roles, one center, sample classes and assignments)**

```bash
php artisan db:seed --class=DemoSeeder
```

| Role | Email | Password |
|------|-------|----------|
| Center Admin | `center.admin@aspire.test` | `Password123` |
| Teacher | `nusrat.jahan@aspire.test` | `Password123` |
| Parent | `karim.hossain@aspire.test` | `Password123` |
| Student | `ayaan.hossain@aspire.test` | `Password123` |

The demo seeder does not create a Super Admin; use option B for that.

**Option B: your own Super Admin.** Put these lines in `backend/.env`, then run the seeder:

```dotenv
INITIAL_ADMIN_NAME="Your Name"
INITIAL_ADMIN_EMAIL=you@example.com
INITIAL_ADMIN_PASSWORD=choose-a-strong-password
```

```bash
php artisan db:seed
```

> Demo accounts are for local development only. Never reuse real passwords in `.env` files you share,
> and never commit `.env`.

---

## 4. Run the frontend (terminal 2)

```bash
cd frontend
npm ci          # installs exactly the versions in package-lock.json
npm run dev
```

Open **http://localhost:5173** and sign in with one of the accounts above. The dev server forwards every
`/api` request to the backend on port 8000 (see `frontend/vite.config.js`), so there is nothing else to configure.

---

## 5. Check that everything works

Run the automated checks once. They should all pass on a fresh clone.

```bash
# backend
cd backend
php artisan test              # 27 tests should pass
vendor/bin/pint --test        # code style check

# frontend
cd ../frontend
npm run lint
npm run build
```

---

## Everyday commands

| Task | Command (folder) |
|------|------------------|
| Start backend | `php artisan serve` (`backend`) |
| Start frontend | `npm run dev` (`frontend`) |
| Run backend tests | `php artisan test` (`backend`) |
| Run one test | `php artisan test --filter=test_name` |
| Fix PHP style | `vendor/bin/pint` (`backend`) |
| Reset database and reload demo | `php artisan migrate:fresh && php artisan db:seed --class=DemoSeeder` |
| List all API routes | `php artisan route:list --path=api` |
| Lint frontend | `npm run lint` (`frontend`) |
| Production build of frontend | `npm run build` (`frontend`) |

## Settings in `backend/.env`

| Key | Meaning |
|-----|---------|
| `APP_KEY` | Application encryption key (made by `key:generate`). |
| `JWT_SECRET` | Secret that signs login tokens (made by `jwt:secret`). |
| `JWT_TTL` | Token lifetime in minutes (default 60). |
| `DB_CONNECTION` | `sqlite`. The file is `backend/database/database.sqlite`. |
| `APP_TIMEZONE` | `Asia/Dhaka`. Dates and "late" status use this. |
| `INITIAL_ADMIN_*` | Used by `db:seed` to create the first Super Admin. |

Frontend setting (optional): `VITE_API_URL` overrides the API address (default `/api/v1`). Set it in
`frontend/.env.local` only if the backend is not on port 8000.

Problems? See [Troubleshooting and FAQ](Troubleshooting-and-FAQ).
