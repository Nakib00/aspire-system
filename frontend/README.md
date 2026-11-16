# ASPIRE frontend

React and Vite starter for the ASPIRE frontend. This is a setup only: pages, API integration, login and responsive product UI will be built later.

## Setup

1. Install Node.js 20.19+ or 22.12+ and npm.
2. Open a terminal in `frontend`.
3. Run `npm ci` to install the versions in the lock file.
4. Run `npm run dev` and open the local URL printed by Vite.
5. Run `npm run build` to verify a production build; run `npm run lint` to check JavaScript.

`src` contains React components and styles; `public` contains static assets. Use ES modules, PascalCase component names, camelCase variables and functions, and small reusable components. Keep secrets out of frontend code and `.env` files. The backend setup is documented in `../backend/README.md`.
