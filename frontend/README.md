# ASPIRE frontend

React and Vite interface for the super administrator. It connects to the Laravel API for login, centers, and center administrators. Other role dashboards and financial, assignment, and student features are not yet implemented.

## Run locally

1. Follow `../backend/README.md` to install the backend, generate the app and JWT secrets, migrate the database, and seed a super administrator. Start Laravel with `php artisan serve` on port 8000.
2. Install Node.js 20.19+ or 22.12+ and npm.
3. Open a second terminal in `frontend`, then run `npm ci` and `npm run dev`.
4. Open the local URL printed by Vite and sign in with the super-admin account configured in the backend `.env`.

The development server proxies `/api` to `http://127.0.0.1:8000`. To use another API, set `VITE_API_URL` to its API prefix (for example `https://your-api.example/api/v1`) when building, and configure that server's CORS policy for the frontend origin. Do not put secrets in frontend environment variables. JWTs are stored in session storage and cleared when the browser tab is closed or you sign out. Use HTTPS outside local development.

Run `npm run build` to create a production build and `npm run lint` to check JavaScript. List pages load all API pages before applying their local search; server-side search can be added as the data set grows.
