# Simple CRM

Full-stack CRM built only with Next.js (App Router pages + API route handlers) and Postgres (Neon). Deploys to Vercel as-is.

## Features
- **Auth**: sign up, sign in, log out, change password. Sessions are signed httpOnly cookies (7 days).
- **Dashboard**: contacts, open pipeline, won revenue, win rate, open/overdue tasks, pipeline by stage, recent contacts, upcoming tasks.
- **Contacts**: search, filter by status, CSV export, detail page with notes, linked deals and tasks.
- **Deals**: drag-and-drop pipeline board (new → qualified → proposal → negotiation → won/lost).
- **Tasks**: due dates, priorities, done/overdue/today views, linked to contacts.

## Roles
| | User | Admin |
|---|---|---|
| Own contacts, deals, tasks, notes | ✓ | ✓ |
| See and edit everyone's records, filter by owner, reassign owner | | ✓ |
| Team performance on dashboard | | ✓ |
| Manage users: add, change role, disable/enable, reset password, delete | | ✓ |

Public sign-up always creates a **user**. The first **admin** is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` when the database has no users. After that, admins promote others from **Users**. Deleting a user moves their records to the admin who deleted them. Disabled users are logged out right away.

## Run locally
```bash
cp .env.example .env   # fill in values
npm install
npm run dev
```
Tables are created and migrated automatically on first request.

## Deploy on Vercel
1. Push to GitHub and import the repo in Vercel.
2. Add env vars: `DATABASE_URL`, `JWT_SECRET` (long random string), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Deploy.
