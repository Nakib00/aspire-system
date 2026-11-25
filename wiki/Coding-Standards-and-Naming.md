# Coding Standards and Naming

One page that answers: **"How do I write this so it looks like the rest of the project?"**
Every example below is taken from (or modelled on) our real code.

## 1. Naming cheat sheet

| Thing                                   | Style                                        | Good                                                                 | Bad                                        |
| --------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| **PHP class / trait / interface** | `PascalCase`, singular noun                | `AssignmentController`, `SavesSubmissions`                       | `assignment_controller`, `Assignments` |
| **PHP method**                    | `camelCase`, starts with a verb            | `addAttachment()`, `teacherId()`                                 | `AddAttachment()`, `attachment_add()`  |
| **PHP variable / parameter**      | `camelCase`                                | `$teacherId`, `$centerAdmin`                                     | `$teacher_id`, `$TeacherId`            |
| **PHP constant**                  | `UPPER_SNAKE_CASE`                         | `MAX_FILES`, `STATUSES`                                          | `maxFiles`                               |
| **PHP boolean**                   | reads like a question                        | `$active`, `isOpen()`, `canSignIn()` | `$flag`, `$status1` |                                            |
| **Database table**                | `snake_case`, plural                       | `attendance_records`                                               | `AttendanceRecord`                       |
| **Database column**               | `snake_case`                               | `due_at`, `max_marks`, `section_id`                            | `dueAt`                                  |
| **JSON key (API)**                | `snake_case` (same as column)              | `students_count`, `due_at`                                       | `studentsCount`                          |
| **URL path**                      | `kebab-case`, plural nouns                 | `/center-admins`, `/portal/student`                              | `/centerAdmins`, `/getStudent`         |
| **Route parameter**               | `camelCase`                                | `{centerAdmin}`, `{assignment}`                                  | `{center_admin_id}`                      |
| **Migration**                     | `snake_case` sentence                      | `add_token_version_to_users_table`                                 | `fix`                                    |
| **Test method**                   | `test_` + `snake_case` sentence          | `test_attendance_can_be_taken_updated_and_reported`                | `testAttendance`                         |
| **React component**               | `PascalCase`                               | `TeacherWorkspace`, `ConfirmDialog`                              | `teacherWorkspace`                       |
| **React hook**                    | `use` + `PascalCase`                     | `useSession`, `useToast`                                         | `session`, `UseToast`                  |
| **JS variable / function**        | `camelCase`                                | `formatDate`, `isLoading`                                        | `format_date`                            |
| **JS constant (module level)**    | `UPPER_SNAKE_CASE`                         | `ROLE_META`, `WORKSPACES`, `NAV`                               | `roleMeta`                               |
| **JS boolean**                    | `is…`, `has…`, `can…`, or adjective | `busy`, `loading`, `isImageName`                               | `check`                                  |
| **Event handler prop**            | `on` + Event                               | `onClose`, `onSave`, `onLogout`                                | `closeHandler`                           |
| **CSS class**                     | `kebab-case`                               | `card-head`, `btn-primary`, `stat-icon`                        | `cardHead`                               |
| **CSS variable**                  | `--kebab-case`                             | `--primary`, `--text-2`                                          | `--Primary`                              |
| **React file**                    | `PascalCase.jsx`                           | `People.jsx`                                                       | `people.jsx`                             |
| **JS module file**                | `camelCase.js`                             | `format.js`                                                        | `Format.js`                              |
| **Git branch**                    | `type/short-kebab-description`             | `feature/attendance-report`                                        | `my-branch`                              |
| **Wiki page**                     | `Title-Case-With-Dashes`                   | `Getting-Started`                                                  | `getting started`                        |

> Memory trick: **code is camelCase, data is snake_case, URLs and CSS are kebab-case, types are PascalCase, constants SHOUT.**

## 2. PHP style (backend)

The standard is **PSR-12 with the Laravel preset**, enforced by **Laravel Pint**.

```bash
cd backend
vendor/bin/pint          # fix everything automatically
vendor/bin/pint --test   # only check (used before a PR)
```

Rules you will see in our code:

* One class per file; the namespace matches the folder (`App\Http\Controllers\Api\Teacher`).
* 4 spaces, LF line endings (`.editorconfig`), final newline.
* **Type everything you can**: parameter types, return types (`: JsonResponse`), typed class constants.
* Early returns and `abort_unless()` for permission checks instead of deep nesting.
* Short arrow functions for one-line callbacks: `fn ($q) => $q->where('role', 'center_admin')`.
* Validation arrays use the array style, not pipes: `['required', 'string', 'max:255']`.

### A controller method the way we write it

```php
/**
 * Post an announcement to a class.
 *
 * POST /api/v1/teacher/classes/{class}/announcements
 */
public function store(Request $request, string $class): JsonResponse
{
    $section = $this->myClass($request, $class);          // 1. scope + permission
    $data = $request->validate([                          // 2. validate
        'title' => ['nullable', 'string', 'max:255'],
        'body' => ['required', 'string', 'max:5000'],
        'pinned' => ['sometimes', 'boolean'],
    ]);
    $item = Announcement::create($data + [                // 3. use the model
        'section_id' => $section->id,
        'teacher_id' => $request->user()->id,
    ]);

    return response()->json(['data' => $item->load('teacher:id,name')], 201); // 4. respond
}
```

The same four steps (**scope → validate → model → respond**) apply to every controller method.

### Classes: how to write them

| Class type              | Rules                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model**         | Singular noun. `$guarded = ['id']`. Relations with return types. Casts in `casts()`. No request code.                                                                                                                           |
| **Controller**    | Name ends with `Controller`. Thin: no long business logic. Role-specific ones extend a *scoped* base. Methods: `index`, `show`, `store`, `update`, `destroy` for REST; verbs for extras (`enroll`, `publishAll`). |
| **Trait**         | Describes a capability: `SavesSubmissions`, `ShowsStudentWork`. Lives in `Concerns/`.                                                                                                                                         |
| **Middleware**    | Single responsibility, name says what it does.                                                                                                                                                                                      |
| **Abstract base** | `abstract class` + protected hook methods (template-method pattern, see `PersonController`).                                                                                                                                    |

### Functions: how to write them

* A method does **one thing**; if you need "and" in its name, split it.
* Keep methods short; extract a private helper (`rules()`, `withStats()`) when a block repeats.
* Name a method after **what it does**, not how: `publishAll`, not `loopAndUpdateGrades`.
* No magic numbers: `private const MAX_FILES = 8;`.
* Never return different types from the same method.

## 3. JavaScript / React style (frontend)

Checked by **oxlint** (`npm run lint`). Rules you will see:

* ES modules, **function components**, hooks. No class components.
* 2 spaces, single quotes, **no semicolons**, trailing commas in multi-line literals.
* One exported component per file where practical; small private helpers may share a file.
* **Props** are destructured in the parameter list: `function Stat({ icon, label, value })`.
* Never mutate state; use the setter with a new value.
* Fetching goes through `request()` / `getAll()` from `models/api.js`; never call `fetch` directly in a component.
* Display formatting goes into `models/format.js`; never format dates inline.
* Every network call handles **loading, success and error** (skeleton, toast, alert with "Try again").

### A component the way we write it

```jsx
/**
 * Clickable summary tile used on dashboards.
 *
 * @param {{icon: string, label: string, value: string|number, note: string, tone: string, onClick: () => void}} props
 */
export function Stat({ icon, label, value, note, tone, onClick }) {
  return (
    <button className="stat" onClick={onClick}>
      <span className={`stat-icon tone-${tone}`}><Icon name={icon} /></span>
      <span className="stat-body"><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
    </button>
  )
}
```

### A hook the way we write it

```js
/** Controller hook for transient feedback messages. @returns {{ toast, notify, dismiss }} */
export function useToast() {
  const [toast, setToast] = useState(null)
  const notify = useCallback((text, type) => setToast({ text, type }), [])
  const dismiss = useCallback(() => setToast(null), [])
  return { toast, notify, dismiss }
}
```

## 4. Comments and documentation

* Comment the **why**, not the what. `// clear locally even if the server is unreachable` is good; `// set session to null` is noise.
* Every class, public method, component and hook has a doc block. See [Source Code Documentation](Source-Code-Documentation).
* Delete commented-out code; Git remembers it.
* A `TODO` must say who and why: `// TODO(nakib): replace with PDF export once invoices exist`.

## 5. Security rules (non-negotiable)

1. Never trust the client: **validate** and **authorise** on the server for every request.
2. Never put secrets in code or Git: use `.env`. Never commit `.env`.
3. Always scope queries to the caller (center / class / child).
4. Never return `password`, `token_version` or file `path` (models already hide them).
5. Uploaded files go to the **private** disk and are served only through signed URLs.
6. Do not build SQL with string concatenation; use Eloquent or bound parameters.

## 6. Pull request checklist (copy into your PR)

- [ ] `vendor/bin/pint --test` passes
- [ ] `php artisan test` passes
- [ ] `npm run lint` and `npm run build` pass
- [ ] New behaviour has a test
- [ ] New/changed classes, methods and components have doc blocks
- [ ] Names follow the cheat sheet above
- [ ] No `.env`, database file, `vendor/` or `node_modules/` in the diff
- [ ] Wiki page updated if the database, API or setup changed
