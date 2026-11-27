# Frontend Guide (React)

Stack: **React 19**, **Vite 8**, plain **CSS** (design tokens), **oxlint**. No UI framework and no router
library: each role has a *workspace* that switches pages with state.

## Boot sequence

`index.html` → `src/main.jsx` → `App.jsx` → either `Login` or the **workspace of the signed-in role**.

```jsx
const WORKSPACES = {
  super_admin: SuperAdminWorkspace,
  center_admin: CenterAdminWorkspace,
  teacher: TeacherWorkspace,
  parent: ParentPortal,
  student: StudentPortal,
}
```

`App` reads the session from the `useSession()` hook; no session shows `Login`.

## Layers (see [Architecture (MVC)](Architecture-MVC))

| Folder | Contents |
|--------|----------|
| `models/api.js` | `request(path, { token, method, body })` and `getAll(path, token)` (fetches every page). Turns errors into `Error` with `.message`, `.status`, `.fields`. |
| `models/format.js` | `formatDate`, `formatDateTime`, `formatRelative`, `dueLabel`, `fileSize`, `initials`, … |
| `models/domain.js` | `DAYS`, `ROLE_META`, `scheduleText`, `matches`, `guardianPayload` |
| `controllers/useSession.js` | `{ session, login, logout }`: token and user in `sessionStorage` |
| `controllers/useToast.js` | `{ toast, notify, dismiss }`: feedback messages |
| `views/components/ui.jsx` | `Icon`, `Brand`, `Avatar`, `StatusBadge`, `Field`, `Empty`, `Skeleton`, `Modal`, `ConfirmDialog`, `Toast`, `HelpDialog` |
| `views/components/shared.jsx` | `PageHeader`, `Stat`, `Toolbar`, `Shell` (sidebar + top bar) |
| `views/pages/` | One file per screen or workspace |
| `views/styles/` | `index.css` (tokens + reset), `App.css` (components), `teacher.css` |

## A workspace page, step by step

Every role workspace follows the same recipe (look at `Teacher.jsx`):

1. `const NAV = [[id, icon, label], ...]`: the sidebar items.
2. State: `page`, `modal`, data lists, `loading`, `error`, plus `const { toast, notify, dismiss } = useToast()`.
3. A `refresh()` that loads data with `request()` / `getAll()` and sets `loading`/`error`.
4. Handlers: `save…`, `delete…` that call the API, then `notify('…')` and `refresh()`.
5. JSX: `<Shell nav={NAV} …>` → `<PageHeader …>` → the current page component → modals → `<Toast …>`.

Every API call shows the three states: **loading** (`<Skeleton/>`), **error** (red alert with *Try again*), **result** (data, or `<Empty/>` when there is none).

## Calling the API

```js
import { request } from '../../models/api'

const result = await request('/teacher/assignments', { token })                 // GET
await request('/teacher/assignments', { token, method: 'POST', body: payload }) // JSON
await request(`/teacher/assignments/${id}/attachments`, { token, method: 'POST', body: formData }) // file upload
```

Handle failure with `try/catch`; show `err.message`; put `err.fields` (a `{ field: [messages] }` object) on the form's `Field` components.

## Forms

* Use `<Field label hint error required>` around each input: it adds the required marker, hint and error text.
* Keep form state in `useState`; disable the submit button while `busy`.
* On a 422, show `err.fields[name]` under the matching field and a summary alert on top.
* Destructive actions open `<ConfirmDialog danger …>`.

## Styling

* Colours, radius and fonts are **CSS variables** at the top of `views/styles/index.css` (`--primary`, `--danger`, …). Never hard-code a colour in a component; use a variable.
* Class names are `kebab-case`; shared look = shared class (`card`, `btn btn-primary`, `badge badge-success`).
* Layout is responsive: sidebar becomes a slide-in menu on small screens.
* `prefers-reduced-motion` turns animation off.
* Dark mode is not implemented.

## Accessibility checklist for every new screen

- [ ] Every input has a visible label (`Field`) or `aria-label`
- [ ] Icon-only buttons have `aria-label`
- [ ] Dialogs use `Modal` (focus trap, Esc, `aria-modal`)
- [ ] Status is shown with text, not colour alone
- [ ] Everything works with the keyboard only

## Commands

| Command | Meaning |
|---------|---------|
| `npm ci` | Install exact dependencies |
| `npm run dev` | Dev server on :5173 with hot reload |
| `npm run lint` | oxlint |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the build locally |

## Adding a new screen (recipe)

1. Create `views/pages/MyPage.jsx` with an `@file` comment and a documented component.
2. Receive data and callbacks as **props**; do not fetch inside small presentational components.
3. Add it to the role workspace: an entry in `NAV`, a title in `titles`, and a line in the JSX switch.
4. Load its data in the workspace `refresh()`.
5. Use `Skeleton`, `Empty` and `Toast` for status.
6. Run `npm run lint && npm run build`.
7. Open the page in the browser with the matching demo account and try the keyboard.
