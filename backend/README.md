# ASPIRE backend

Laravel 13 MVC foundation for the ASPIRE API. This stage provides the project setup, SQLite migrations and Eloquent models; API endpoints, authentication, authorization, business rules, seed data and the user interface are future work. The schema alone does not enforce role or center isolation, payment atomicity, file validation, or notification delivery.

## Requirements

- PHP 8.3 or later with SQLite/PDO SQLite, mbstring, XML, OpenSSL, cURL and fileinfo extensions.
- Composer 2 and Git. ZIP support in PHP or an unzip utility makes installation faster.
- Node.js 20.19+ or 22.12+ and npm for the separate React frontend.

## Setup (Windows PowerShell)

1. Clone the repository and open a terminal in `backend`.
2. Run `composer install`.
3. Run `Copy-Item .env.example .env` (only if `.env` does not already exist).
4. Run `php artisan key:generate`.
5. Run `New-Item -ItemType File -Force database/database.sqlite` if the file does not exist. The example configuration uses SQLite; keep `DB_CONNECTION=sqlite` and do not set a MySQL database.
6. Run `php artisan migrate` to create the tables.
7. Run `php artisan serve`. The default address is http://127.0.0.1:8000.
8. In another terminal follow `frontend/README.md` to run React.

On macOS/Linux use `cp .env.example .env` and `touch database/database.sqlite` instead. Never commit `.env`, the SQLite database, `vendor`, or uploaded files. Run `php artisan test` for backend tests and `vendor/bin/pint` to format PHP.

## Structure and conventions

Laravel follows MVC: `app/Models` holds Eloquent models, `app/Http/Controllers` will hold HTTP controllers, `routes` declares routes, `database/migrations` versions the database, `database/seeders` is for seed data, and `tests` holds automated tests. The separate React frontend will provide views. Use REST resource-oriented routes when the API is implemented.

PHP follows PSR-12 and Laravel conventions, formatted by Laravel Pint: four-space indentation, PascalCase class names, camelCase methods, snake_case database names, explicit validation and small focused classes. These rules improve consistency and make reviews and maintenance easier. PHP classes use PSR-4 autoloading through Composer. JavaScript uses ES modules, React components in PascalCase, and the Vite lint command for consistent code.

## Database design

Users have a role (`super_admin`, `center_admin`, `teacher`, `student`, or `parent`), an active flag, and an optional center ID (super admins have no center). Sections connect to teachers and students through pivot tables; parents connect to children via `parent_student`. Fees generate student invoices; invoices have payments. Assignments belong to sections and teachers; submissions belong to students and have at most one grade. Notifications use Laravel's database notification structure. Audit logs can store payment/grade changes. Foreign keys and unique indexes protect several relationships. `users.center_id` is indexed but application validation must check the center exists and enforce cross-center relationships until a foreign key is added.

Money fields ending in `_minor` are integer minor units (for example, 100 means 1.00); the future API must define a currency and convert consistently. Status and role values, due calculations, ownership checks, published visibility, uploads, transaction boundaries and audit writing must be validated and implemented in later features. SQLite is convenient for development; the 100-user performance target has not been load tested and production database suitability must be assessed separately.
