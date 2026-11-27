# Source Code Documentation

Goal: someone who has never seen the file can tell **what it is, what it expects and what it gives back**
without reading the whole body.

## Coverage today

| Area | What is documented |
|------|--------------------|
| Backend controllers | Every class has a summary; every public/protected endpoint method has a summary and its HTTP route |
| Backend models | Every class has a summary and MVC role; every relation has a return type and description |
| Backend middleware, base controller | Class summary and behaviour |
| Frontend files | Every file starts with an `@file` comment naming its MVC layer |
| Frontend components, hooks, functions | JSDoc with `@param` / `@returns` |
| Project docs | This wiki, `README.md`, `docs/*.md` |

Not documented line-by-line: private one-liner helpers whose name already says everything, and test methods
(their names are sentences).

## PHP: PHPDoc

```php
/**
 * Create or update the grade and feedback for a submission.
 *
 * PUT /api/v1/teacher/submissions/{submission}/grade
 */
public function grade(Request $request, string $id): JsonResponse
```

Rules:

1. **Class**: one sentence on what it is; for controllers/models also the MVC role.
2. **Endpoint method**: one sentence + the route on its own line.
3. **Relation**: one line, `/** The student the work belongs to. */`, and a return type.
4. Add `@param` / `@return` only when the native type is not enough: `/** @return array<string, mixed> */`.
5. Write in the present tense, imperative or descriptive: "Create…", "Returns…". No "This method…".

## JavaScript: JSDoc

```js
/**
 * Fetch every page of a paginated endpoint and return the merged items.
 *
 * @param {string} path - Collection path, e.g. `/admin/centers`.
 * @param {string} token - Bearer token of the signed-in user.
 * @returns {Promise<Array>} All items from every page, in server order.
 */
export async function getAll(path, token) { ... }
```

Component props are documented as one object: `@param {{ title: string, onClose: () => void }} props`.
Each file begins with:

```js
/**
 * @file View layer: low-level, stateless UI building blocks (icons, fields, dialogs, toasts).
 */
```

## What good comments look like

| Good (says why) | Bad (repeats the code) |
|-----------------|------------------------|
| `// Students never sign in, so they need no email or password.` | `// return false` |
| `// clear locally even if the server is unreachable` | `// catch error` |
| `// 404, not 403, so users cannot discover other centers` | `// abort` |

## Keeping documentation true

* Change the code → change its doc block **in the same commit**. Reviewers check this (see [Git Workflow and Code Review](Git-Workflow-and-Code-Review)).
* Change the database or an endpoint → update [Database](Database) / [API Reference](API-Reference).
* Prefer a clear name over a comment. Rename first, comment second.

## Quality checks you can run

```bash
vendor/bin/pint --test        # style (PHP)
npm run lint                  # style/rules (JS)
php artisan route:list --path=api   # does the API match API-Reference?
```

PHP doc coverage is not measured by a tool yet. A good next step is adding `phpDocumentor` or a
PHPStan rule for missing docblocks, and `eslint-plugin-jsdoc` for the frontend.
