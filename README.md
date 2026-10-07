# Simple CRM (Next.js only)

Frontend and backend are both in Next.js (API routes in `app/api`). Data is stored in Postgres (Neon).

## Roles
- **admin**: manage users (create admin/user, delete), see and edit all contacts
- **user**: add, edit and delete only their own contacts

The first admin is created automatically from `ADMIN_EMAIL` / `ADMIN_PASSWORD` the first time the app connects to an empty database.

## Run locally
```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to GitHub and import it in Vercel.
2. In the project, open **Storage → Create → Neon (Postgres)** and connect it. This sets `DATABASE_URL` for you.
3. Under **Settings → Environment Variables**, add `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Redeploy, then log in with the admin email and password.
