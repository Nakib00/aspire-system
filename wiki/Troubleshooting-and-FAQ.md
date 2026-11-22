# Troubleshooting and FAQ

## Setup problems

| Symptom | Cause | Fix |
|---------|-------|-----|
| `php` / `composer` / `node` "not recognized" | Not installed or not on `PATH` | Install, then **close and reopen** the terminal. On Windows check *Environment Variables → Path*. |
| `composer install` says a PHP extension is missing | Extension disabled in `php.ini` | Run `php --ini`, open that file, remove `;` before the needed `extension=` line (`mbstring`, `openssl`, `fileinfo`, `curl`, `zip`, `pdo_sqlite`, `sqlite3`). |
| `could not find driver` | `pdo_sqlite` not enabled | Enable `extension=pdo_sqlite` and `extension=sqlite3` in `php.ini`. |
| `Your PHP version … does not satisfy` | PHP older than 8.3 | Install PHP 8.3 or newer. |
| `No application encryption key has been specified` | Forgot `php artisan key:generate` | Run it (and `php artisan jwt:secret`). |
| `Database file at path [...] does not exist` | No `database.sqlite` | Create an empty file: `touch database/database.sqlite` (PowerShell: `New-Item database/database.sqlite -ItemType File`), then `php artisan migrate`. |
| `Unable to locate .env` or settings ignored | `.env` missing, or config cached | `cp .env.example .env`, then `php artisan config:clear`. |
| `npm ci` fails with engine error | Node too old | Use Node 20.19+ or 22.12+. |
| Port 8000 or 5173 already in use | Another program | `php artisan serve --port=8001` (and set `proxy` target in `frontend/vite.config.js`), or stop the other program. Vite picks the next free port by itself. |

## Runtime problems

| Symptom | Cause | Fix |
|---------|-------|-----|
| Login page says "Unable to reach the server" | Backend not running or wrong port | Start `php artisan serve` in `backend`. Check http://127.0.0.1:8000/api/v1/me returns JSON. |
| Login says "Invalid credentials or inactive account" | Wrong password, user inactive, no center, or placeholder student | Use a demo account ([Getting Started](Getting-Started)); check `active` and `center_id`. |
| Everything returns 401 after a while | Token expired (60 minutes) or `token_version` changed | Sign in again. |
| 403 on a page | Signed in with the wrong role for that endpoint | Use the right account ([Authentication and Roles](Authentication-and-Roles)). |
| 404 for a record you can see in the database | It belongs to another center/teacher, by design | Check `center_id` and enrolment. |
| 422 with messages | Validation failed | Read `errors` in the response; fix the field. |
| Uploaded file cannot be opened after a while | Signed link lasts 2 hours | Reload the page to get a fresh link. |
| Demo data missing | Seeder not run | `php artisan db:seed --class=DemoSeeder` (skips if already loaded). |
| Want a clean database | | `php artisan migrate:fresh` then seed again (**deletes all data**). |
| Tests fail with database errors | Stale config cache | `php artisan config:clear` then `php artisan test`. |
| `vendor/bin/pint --test` fails after you saved a file | Style differences | Run `vendor/bin/pint` to fix automatically. |

## Windows notes

* Prefer **PowerShell** or **Git Bash**. `cp` works in Git Bash; in PowerShell use `Copy-Item`.
* If PowerShell blocks scripts, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
* Git may warn "LF will be replaced by CRLF". That is harmless: the repository `.editorconfig` uses LF.

## FAQ

**Why is a class called a "section" in code?**
The model was named `Section` first. The user interface and URLs say "class" (`/center/classes`). They are the same thing.

**Why can students have no email?**
Most students do not sign in. They get a placeholder email (`…@students.aspire.local`) and cannot log in until a Center Admin enables it.

**Why does a parent not see a grade?**
`grades.published` must be true. New grades are released by default, but the teacher can untick "Release grade to parents"; the grade then stays private until released (single grade or "Release all grades").

**Can I use MySQL or PostgreSQL?**
The app uses plain Eloquent, so it should work, but the project is developed and tested on SQLite only. Change `DB_*` in `.env`, run `migrate`, and run the tests before trusting it.

**Where are uploaded files?**
`backend/storage/app/private`. They are not in Git and are never public.

**Where do I change the colours?**
CSS variables at the top of `frontend/src/views/styles/index.css`.

**How do I reset my demo password?**
Re-seed (`migrate:fresh` + `DemoSeeder`), or in `php artisan tinker`: `User::where('email','x')->first()->update(['password' => 'new-password'])`.

**CI is green/red where?** CI is not active yet; see [Implementation Status](Implementation-Status). Run the checks locally.
