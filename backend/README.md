# ASPIRE backend

Laravel 13 MVC foundation for the ASPIRE API. Administrator authentication and center and center-admin management are available. Other roles, financial workflows, assignments, notification delivery, and the user interface are future work; the schema alone does not enforce their access rules or business invariants.

## Requirements

- PHP 8.3 or later with SQLite/PDO SQLite, mbstring, XML, OpenSSL, cURL, sodium and fileinfo extensions.
- Composer 2 and Git. ZIP support in PHP or an unzip utility makes installation faster.
- Node.js 20.19+ or 22.12+ and npm for the separate React frontend.

## Setup (Windows PowerShell)

1. Clone the repository and open a terminal in `backend`.
2. Run `composer install`.
3. Run `Copy-Item .env.example .env` (only if `.env` does not already exist).
4. Run `php artisan key:generate` and `php artisan jwt:secret` to generate local application and JWT secrets.
5. If `database/database.sqlite` does not exist, run `Copy-Item database/aspire-template.sqlite database/database.sqlite`. The example configuration uses SQLite; keep `DB_CONNECTION=sqlite` and do not set a MySQL database. Do not overwrite an existing working database.
6. Run `php artisan migrate` to apply any newer migrations.
7. Run `php artisan serve`. The default address is http://127.0.0.1:8000.
8. In another terminal follow `frontend/README.md` to run React.

On macOS/Linux use `cp .env.example .env` and `cp database/aspire-template.sqlite database/database.sqlite` instead, copying only when the destination does not exist. The committed template contains the initial development super-admin account with a hashed password; it has no centers or center admins. Each teammate's ignored `database/database.sqlite` is a separate working copy, so changes are not shared automatically. The template is for local development, not production. Never commit `.env`, a working SQLite database, `vendor`, or uploaded files. Run `php artisan test` for backend tests and `vendor/bin/pint` to format PHP.

## Administrator API

To create the first super administrator on a new installation, set `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in the local `.env` file, then run `php artisan db:seed`. The seeder creates the account only when the email does not already exist; it does not reset existing passwords. Use a strong unique password and keep `.env` private. On the original development machine, the requested initial account has already been created.

Requests and responses use JSON. Send `Accept: application/json`. Log in with `POST /api/v1/login` and JSON `{ "email": "...", "password": "..." }`. The response contains a signed JWT; send `Authorization: Bearer <token>` for protected requests. Tokens expire after 60 minutes by default, and `POST /api/v1/logout` invalidates the current token. `GET /api/v1/me` returns the current account. Login permits active super admins and active center admins assigned to a center; management endpoints below require the super-admin role. Existing opaque tokens from the previous implementation are no longer accepted. Keep `JWT_SECRET` private and consistent between app servers; use a shared durable cache for the JWT blacklist in multi-server deployments.

- `GET /api/v1/centers` lists centers; `POST /api/v1/centers` creates one with `name`, `address`, optional `city`, `phone`, and `status` (`active` or `inactive`).
- `GET /api/v1/centers/{id}` shows details and assigned center admins; `PATCH /api/v1/centers/{id}` updates fields or deactivates a center by setting `status` to `inactive`.
- `GET /api/v1/center-admins` lists center admins; `POST /api/v1/center-admins` creates one with `name`, `email`, `password`, and an active `center_id`.
- `GET /api/v1/center-admins/{id}` shows an account; `PATCH /api/v1/center-admins/{id}` can change its name, email, password, active flag, or center assignment by setting `center_id`. `DELETE /api/v1/center-admins/{id}/center` removes its center assignment without deleting the account. An unassigned admin cannot log in until reassigned. Password changes, deactivation, reassignment and removal invalidate existing tokens.

List responses are paginated. Center and center-admin deletion are intentionally not exposed; status changes preserve related records. Use HTTPS outside local development.

## Structure and conventions

Laravel follows MVC: `app/Models` holds Eloquent models, `app/Http/Controllers` will hold HTTP controllers, `routes` declares routes, `database/migrations` versions the database, `database/seeders` is for seed data, and `tests` holds automated tests. The separate React frontend will provide views. Use REST resource-oriented routes when the API is implemented.

PHP follows PSR-12 and Laravel conventions, formatted by Laravel Pint: four-space indentation, PascalCase class names, camelCase methods, snake_case database names, explicit validation and small focused classes. These rules improve consistency and make reviews and maintenance easier. PHP classes use PSR-4 autoloading through Composer. JavaScript uses ES modules, React components in PascalCase, and the Vite lint command for consistent code.

## Database design

Users have a role (`super_admin`, `center_admin`, `teacher`, `student`, or `parent`), an active flag, and an optional center ID (super admins have no center). Sections connect to teachers and students through pivot tables; parents connect to children via `parent_student`. Fees generate student invoices; invoices have payments. Assignments belong to sections and teachers; submissions belong to students and have at most one grade. Notifications use Laravel's database notification structure. Audit logs can store payment/grade changes. Foreign keys and unique indexes protect several relationships. `users.center_id` is indexed but application validation must check the center exists and enforce cross-center relationships until a foreign key is added.

Money fields ending in `_minor` are integer minor units (for example, 100 means 1.00); the future API must define a currency and convert consistently. Status and role values, due calculations, ownership checks, published visibility, uploads, transaction boundaries and audit writing must be validated and implemented in later features. SQLite is convenient for development; the 100-user performance target has not been load tested and production database suitability must be assessed separately.
