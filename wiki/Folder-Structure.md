# Folder Structure

```
aspire-system/
├── README.md                     Project summary and run guide
├── docs/                         Short engineering docs kept next to the code
├── wiki/                         Source of this wiki (published to the GitHub Wiki)
├── diagram/                      Analysis and design documents (PDF)
│   ├── user-stories/  fr-nfr/  use-case-narratives/
│   ├── use_case_diagram/  data_flow_diagram/  state_diagrams/  uml_diagram/
│   └── center_admin/             Center Admin class, DFD, state, use case
├── backend/                      Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  Controllers (the "C")
│   │   │   │   ├── Center/       Center Admin endpoints
│   │   │   │   ├── Teacher/      Teacher endpoints
│   │   │   │   └── Concerns/     Traits shared by controllers
│   │   │   └── Middleware/       AuthenticateApiToken
│   │   ├── Models/               Eloquent models (the "M")
│   │   └── Providers/
│   ├── bootstrap/app.php         Application setup
│   ├── config/                   Settings (jwt.php, aspire.php, ...)
│   ├── database/
│   │   ├── migrations/           Schema history
│   │   ├── seeders/              DatabaseSeeder, DemoSeeder
│   │   └── factories/
│   ├── routes/                   api.php + one file per role
│   ├── storage/app/private/      Uploaded files (not public)
│   ├── tests/Feature/            Feature (API) tests
│   ├── composer.json             PHP dependencies and scripts
│   └── .env.example              Template for your private .env
└── frontend/                     React app
    ├── index.html
    ├── vite.config.js            Dev server and /api proxy
    └── src/
        ├── main.jsx              Starts React
        ├── App.jsx               Front controller: picks the workspace by role
        ├── models/               api.js, format.js, domain.js
        ├── controllers/          useSession.js, useToast.js
        └── views/
            ├── components/       ui.jsx, shared.jsx, Announcements.jsx, AssignmentContent.jsx
            ├── pages/            One file per screen / workspace
            └── styles/           index.css, App.css, teacher.css
```

## Files you will touch most

| Task | Files |
|------|-------|
| Add an endpoint | `backend/routes/api-*.php`, a controller in `backend/app/Http/Controllers/Api/`, a test in `backend/tests/Feature/` |
| Change the database | `backend/database/migrations/`, the model in `backend/app/Models/` |
| Change a screen | `frontend/src/views/pages/<Role>.jsx` or a component in `views/components/` |
| Call the API | `frontend/src/models/api.js` (`request`, `getAll`) |
| Change colours / spacing | `frontend/src/views/styles/index.css` (design tokens as CSS variables) and `App.css` |

## Files and folders you must never commit

`backend/.env`, `backend/vendor/`, `backend/database/database.sqlite`, `backend/storage/app/private/*`,
`frontend/node_modules/`, `frontend/dist/`. They are in `.gitignore`; if `git status` shows them, stop and ask.

## Naming of files

| Kind | Rule | Example |
|------|------|---------|
| PHP class file | `PascalCase.php`, same as the class | `AssignmentController.php` |
| Migration | `YYYY_MM_DD_HHMMSS_snake_case_description.php` | `2026_11_20_090000_create_announcements_table.php` |
| React component file | `PascalCase.jsx` | `CenterDashboard.jsx` |
| React hook file | `useCamelCase.js` | `useSession.js` |
| Plain JS module | `camelCase.js` | `format.js` |
| Wiki page | `Title-Case-With-Dashes.md` | `Getting-Started.md` |
