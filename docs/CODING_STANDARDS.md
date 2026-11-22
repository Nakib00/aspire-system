# Coding standards and source documentation

## Automated checks

| Project | Tool | Command | Standard |
|---------|------|---------|----------|
| Backend | Laravel Pint | `vendor/bin/pint --test` (omit `--test` to fix) | PSR-12 with the Laravel preset |
| Backend | PHPUnit | `php artisan test` | Feature tests per workflow |
| Frontend | oxlint | `npm run lint` | React hooks rules, React Refresh rules |
| Frontend | Vite | `npm run build` | The build must succeed |

All four must pass before merging.

## Documentation rules

**Backend (PHPDoc)**

* Every class has a docblock saying what it is and, for models and controllers, which MVC role it plays.
* Endpoint methods have a docblock that states the HTTP route.
* Eloquent relations have a return type (`BelongsTo`, `HasMany`, ...) and a one-line description.
* Use `@param` / `@return` only when the native type is not enough (for example `array<string, mixed>`).

**Frontend (JSDoc)**

* Every file starts with a `@file` comment naming its MVC layer.
* Every exported function, component and hook has a JSDoc block with `@param` and, when relevant, `@returns`.
* Components document their props as `@param {{ ... }} props`.
* Comments explain *why* or *what for*. Do not restate the code.

## Naming and style

* PHP: `PascalCase` classes, `camelCase` methods, `snake_case` columns and JSON keys.
* JS: `PascalCase` components, `useCamelCase` hooks, `camelCase` functions, `UPPER_SNAKE` constants.
* Shared UI pieces live in `views/components/`; one screen per file in `views/pages/`.
* Keep controllers thin and functions small; extract a trait, base class or helper when logic repeats.
