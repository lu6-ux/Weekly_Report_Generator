# Weekly Report Generator & Team Dashboard

An internship assignment built with Next.js, TypeScript, Tailwind CSS, Express, Prisma, and PostgreSQL. Members record weekly work; managers review submissions, request corrections, and monitor team progress.

## Features

- HTTP-only cookie authentication, member registration, current user, logout, and role-protected APIs.
- Complete report creation/editing: tasks, blockers, achievements, work hours, next-week plans, and notes/links.
- Draft -> Submitted -> Approved, or Submitted -> Needs Correction -> edit -> resubmit.
- Immutable submission snapshots with numbered versions and linked reviewer comments.
- Member dashboard, report details/history, manager filters and Recharts charts.
- Manager project CRUD; referenced projects cannot be deleted.
- Optional manager-only AI Chat Assistant for report-grounded team questions.
- Zod request validation and Jest/Supertest integration tests against PostgreSQL.

## Structure

```text
backend/
  prisma/schema.prisma, migrations/, seed.ts
  src/app.ts                 Express app (also imported by tests)
  src/server.ts              Development/production listener
  src/controllers/           Authentication and report workflow
  src/routes/                Auth, reports, projects
  src/services/              Report context and AI provider integration
  src/middleware/            Cookie authentication and role checks
  src/validation/            Zod schemas
  tests/                     API integration tests
frontend/
  app/                       Next.js App Router pages
  components/                Shared report form and navigation
  lib/                       Typed API client and data types
```

## Local setup (PowerShell)

Install Node.js 22 LTS or newer and PostgreSQL. Clone this repository, create an empty `weekly_report_db` database, and run these commands from the project directory:

```powershell
git clone <repository-url>
cd weekly-report-system
```

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` with your own local values. Never commit real credentials:

```dotenv
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@localhost:5432/weekly_report_db?schema=public
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

```powershell
npx prisma migrate deploy
npx prisma generate
npm run seed
npm run dev
```

For future schema development, use `npx prisma migrate dev --name descriptive_change`. The included `link_reviews_to_versions` migration adds an optional relation without deleting existing reviews. If Windows reports a locked Prisma engine DLL, stop this project's backend/Prisma processes before running `prisma generate`, then restart the backend.

In another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. The API runs at http://localhost:5000. CORS permits `http://localhost:3000` with credentials. Use `localhost` consistently, rather than mixing it with `127.0.0.1`.

Frontend environment:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
```

This is a public API origin, never a secret. Frontend requests include cookies using `credentials: "include"`.

## Demo Accounts

These accounts are seeded for demonstration and evaluation purposes only. Do not deploy them to production.

| Role    | Email               | Password    |
| ------- | ------------------- | ----------- |
| Manager | manager@example.com | manager123  |
| Member  | test@example.com    | password123 |
| Member  | alex@example.com    | password123 |
| Member  | sam@example.com     | password123 |

Manager account can:

- View team reports
- Review submitted reports
- Request corrections
- Approve reports
- View dashboard analytics
- Manage projects

Member accounts can:

- Create weekly reports
- Save drafts
- Edit their own eligible reports
- Submit/resubmit reports
- View manager feedback
- View their own report history

The seed uses bcrypt before inserting passwords and uses repeatable `upsert` operations for accounts and projects. Existing accounts, passwords, roles, and reports are preserved rather than overwritten. Public registration always creates `MEMBER` accounts; manager/admin roles must be provisioned manually.

The seed includes one manager, three members, three projects, six reports across several weeks, every report status, tasks, blockers, achievements, work hours, submission versions, and manager reviews.

### Presentation Demo Access

**Demo credentials — evaluation environment only**

Use these two primary accounts during the presentation:

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@example.com | manager123 |
| Team Member | test@example.com | password123 |

The complete evaluator account list remains in the Demo Accounts section above. Credentials are not part of the database design diagram.

### Database Design

The ER diagram is maintained separately at [ER-diagram/weekly-report-system.mmd](ER-diagram/weekly-report-system.mmd) and is derived from the current Prisma schema. It contains no demo credentials.

## Pages

`/login`, `/register`, `/dashboard`, `/reports/new`, `/reports/[id]`, `/reports/[id]/edit`, `/manager`, `/manager/projects`. The root redirects to login. Login routes managers/admins to the team dashboard and members to their own dashboard.

## API summary

All routes below use the `/api` prefix.

| Method      | Route                           | Access / purpose                                  |
| ----------- | ------------------------------- | ------------------------------------------------- |
| POST        | /auth/register                  | Public; MEMBER only                               |
| POST        | /auth/login                     | Public; sets HTTP-only JWT cookie                 |
| POST        | /auth/logout                    | Clears cookie                                     |
| GET         | /auth/me                        | Current authenticated user                        |
| GET         | /projects                       | Authenticated users                               |
| POST        | /projects                       | Manager/admin                                     |
| PUT, DELETE | /projects/:id                   | Manager/admin                                     |
| POST        | /reports                        | Create own draft with nested data                 |
| GET         | /reports/my                     | Own reports and latest reviews                    |
| GET         | /reports/all                    | Manager/admin                                     |
| GET         | /reports/:id                    | Owner or manager/admin; full details              |
| PUT         | /reports/:id                    | Owner; DRAFT or NEEDS_CORRECTION only             |
| PATCH       | /reports/:id/submit             | Owner; snapshot then submit                       |
| PATCH       | /reports/:id/approve            | Manager/admin; optional `{ "comment": "..." }`    |
| PATCH       | /reports/:id/request-correction | Manager/admin; required nonblank comment          |
| GET         | /reports/:id/versions           | Owner or manager/admin; newest first with reviews |
| GET         | /health                         | API health                                        |
| POST        | /ai/chat                        | Manager/admin; report-grounded AI question       |

Create/update accepts `weekStart` and `weekEnd` as YYYY-MM-DD, `projectId`, `nextWeekPlans`, `notes`, and arrays `tasks`, `blockers`, `achievements`, `workHours`. Task percentages are integers 0-100; hours are nonnegative; task names and description rows cannot be blank. Omitted create collections default to empty arrays. On update, omitted fields/collections are preserved and explicitly supplied empty arrays clear a collection. Nested replacement is atomic. Duplicate owner/week/project reports return a conflict.

Submissions and reviews run in serializable transactions. Concurrent conflicting requests return a conflict for refresh/retry. Version snapshots capture the full report just before submission, so their status can be DRAFT or NEEDS_CORRECTION. Legacy submitted reports without snapshots can still be reviewed; their review has no version link. Existing history is not fabricated.

Dashboard actual task hours sum task actualHours. The Work Hours chart separately sums the categorized work-hour entries; these two user-entered views are not added together. Manager chart/list filters use employee, project, status, and a date contained in the report's week. Top summary cards show all reports.

## Verification

```powershell
cd backend
npx prisma generate
npx prisma migrate status
npm run build
npm test -- --runInBand
```

The 15 integration tests need the configured PostgreSQL database and applied migrations, but no running HTTP server. They create uniquely named test accounts/projects/reports and clean up only their own records. Set DATABASE_URL to a dedicated test database if desired and migrate it first. Tests cover authentication, CORS, ownership, validation, full persistence, correction/resubmission, immutable versions, reviews, approval, project CRUD, AI authorization, and public registration role restrictions.

```powershell
cd frontend
npm run lint
npm run build
```

Manual walkthrough:

1. Log in as a member, create a report with every collection, then view and edit it.
2. Submit; verify editing is unavailable and version 1 appears.
3. Log out and log in as manager; filter reports and request correction with a comment.
4. Return as the member; verify feedback, edit the report, and resubmit.
5. Approve as manager; verify two snapshots and reviews linked to the correct versions.
6. Create/edit/delete an unused project; verify projects with reports cannot be deleted.

## AI Chat Assistant

The optional AI Chat Assistant helps managers and admins ask concise questions about team activity, completed work, blockers, project activity, and report-based workload observations. It is available from the Manager Dashboard and does not persist chat history.

Architecture:

```text
Manager -> Chat Widget -> Protected Backend AI API -> Prisma -> PostgreSQL Reports
  -> Relevant Report Context -> OpenAI API -> AI Response -> Manager
```

The backend authenticates the HTTP-only session cookie and requires `MANAGER` or `ADMIN` before handling a chat request. It detects common date phrases such as `last week`, `this week`, and `this month`, plus quoted project/member names and report statuses. Prisma selects only report dates, status, project/member names, tasks, achievements, blockers, plans, notes, and work-hour summaries. Passwords, emails, tokens, and unrelated user fields are never sent to the provider.

The provider integration uses OpenAI Chat Completions through a backend-only `OPENAI_API_KEY`; the frontend never receives the key. The system prompt requires answers to use only the supplied report context, avoid invented facts, identify recurring blockers only when supported, and describe workload as an observation rather than an HR judgment. Set `OPENAI_MODEL` to override the default `gpt-4o-mini`. Without a key, provider failure, timeout, or empty response, the API returns a friendly unavailable message.

Limitations: answers depend on the quality, completeness, status, and date coverage of submitted reports. Natural-language filtering is intentionally simple, chat history is session-only, and AI output should be reviewed rather than treated as an authoritative performance assessment.

## Screenshots

Add final screenshots here before submission:

- Login and registration: `[screenshot placeholder]`
- Member dashboard and complete report form: `[screenshot placeholder]`
- Report details, feedback, and version history: `[screenshot placeholder]`
- Manager dashboard with charts/filters: `[screenshot placeholder]`
- Project management: `[screenshot placeholder]`

## Deployment

Build backend with `npm run build`, run `npx prisma migrate deploy`, then `npm start` (runs `dist/server.js`). Build frontend with `npm run build`, then `npm start`. Supply database credentials and a strong JWT_SECRET through your host's secret storage. Set NEXT_PUBLIC_API_URL before the frontend build. Configure the Express CORS origin for the deployed frontend. Production cookies use Secure and require HTTPS. Prefer frontend/API under the same site; a cross-site deployment also needs explicit cookie SameSite/CORS configuration. Do not run the demo seed in production.

The current Prisma 6 dependency tree reports an npm audit advisory in its configuration dependency (`deepmerge-ts`). No forced Prisma downgrade was applied; assess a compatible dependency upgrade separately before production deployment.
