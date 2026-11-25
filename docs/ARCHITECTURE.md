# Architecture: MVC

Aspire is two projects that together follow the **Model–View–Controller** pattern. The backend is a
JSON API, the frontend renders that JSON, and each side is further split along the same three roles.

```
 Browser ──► View (React pages/components)
                │ user action
                ▼
         Controller (React hooks)  ──HTTP/JSON──►  Controller (Laravel) ──► Model (Eloquent) ──► SQLite
                ▲                                         │
                └──────────────── JSON "view" ◄───────────┘
```

## Backend (`backend/`, Laravel)

| MVC role | Location | Responsibility |
|----------|----------|----------------|
| **Model** | `app/Models/` | Tables, relations, casts, accessors. No HTTP knowledge. |
| **Controller** | `app/Http/Controllers/Api/` | Authorise, validate, call models, return a response. |
| **View** | JSON responses (`response()->json(...)`) | The API is the presentation layer; the React app renders it. |
| Routing | `routes/api*.php` | One file per role: admin, center, teacher, portal, student. |
| Cross-cutting | `app/Http/Middleware/` | JWT authentication (`AuthenticateApiToken`). |
| Shared behaviour | `Controllers/Api/Concerns/` | Traits reused by several controllers. |

Rules:

* Controllers use Eloquent and the relations declared on the models rather than hand-written SQL strings.
* Role scoping lives in a base controller (`CenterScopedController`, `TeacherScopedController`) so a
  controller cannot forget to restrict a query to the caller's center or classes.
* `PersonController` is a template-method base: `StudentController`, `ParentController` and
  `TeacherController` only declare what differs.
* Validation happens in the controller before any model is written.

## Frontend (`frontend/src/`, React + Vite)

| MVC role | Location | Responsibility |
|----------|----------|----------------|
| **Model** | `models/` | `api.js` (HTTP client), `format.js` (pure formatters), `domain.js` (constants and pure helpers). No React. |
| **View** | `views/components/` | Reusable, presentational building blocks (`ui.jsx`, `shared.jsx`, ...). |
| **View** | `views/pages/` | One file per screen or workspace (Teacher, Student, SuperAdmin, ...). |
| **View** | `views/styles/` | CSS. |
| **Controller** | `controllers/` | React hooks that own application state: `useSession` (sign-in/out), `useToast` (feedback). |
| Entry | `App.jsx`, `main.jsx` | `App` is the front controller that picks a workspace from the signed-in role. |

Dependency rule: **views → controllers → models**, never the other way. `models/` imports nothing from
React or from the other layers.

> Workspace pages (for example `Teacher.jsx`) still hold page-level state next to their JSX. They are
> documented as "View layer + page controller". Moving that state into `controllers/` hooks one page at
> a time is the natural next step.
