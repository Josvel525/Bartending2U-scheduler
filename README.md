# Bartending2U Scheduler

A scheduling suite for managing bartending events, employees, and in-progress drafts. The project now includes a TypeScript/Express backend powered by Prisma ORM and a PostgreSQL/SQLite database, plus updated front-end integrations for saving and submitting scheduler forms.

## Project structure

```
.
├── server/                 # Express + Prisma backend
│   ├── src/                # Application source (routes, middleware, env)
│   ├── prisma/             # Prisma schema, migrations, seed script
│   ├── package.json        # Backend dependencies and scripts
│   └── Dockerfile          # Container build for the API service
├── *.html / styles.css     # Static front-end dashboard
├── api.js                  # Lightweight fetch helper used by the scheduler UI
├── events-page.js          # Updated scheduler/event page interactions
└── Bartending2U-scheduler.postman_collection.json
```

## Prerequisites

- Node.js 18 or higher (Node 20 recommended to match CI)
- npm or pnpm (examples below use pnpm per migration instructions)
- For production: a PostgreSQL database and `DATABASE_URL`

## Environment configuration

1. Duplicate `.env.example` into `server/.env` (or export variables in your shell).
2. Set `DATABASE_URL` to a valid connection string. Examples:
   - Local SQLite (development default): `file:../dev.db`
   - PostgreSQL (production): `postgresql://user:password@hostname:5432/database`
3. Optionally set:
   - `FRONTEND_ORIGIN` for allowed CORS origin in development
   - `PORT` (defaults to `4000`)
   - `ENABLE_CORS=false` for production hardening

The backend auto-falls back to SQLite when `NODE_ENV !== 'production'` and no database URL is provided.

## Install dependencies

```bash
cd server
npm install
npm run generate
```

The `generate` script runs `prisma generate` to create the Prisma client.

## Database migrations & seed data

Following the requested command sequence:

```bash
pnpm prisma generate && pnpm prisma migrate dev && pnpm prisma db seed
```

Using npm instead of pnpm:

```bash
npm run generate
npx prisma migrate dev
npm run seed
```

This applies migrations and loads starter employees defined in `prisma/seed.ts`.

## Running the API locally

```bash
cd server
npm run dev:server
```

The server starts on `http://localhost:4000` by default with hot reload via `ts-node-dev`.

To run a compiled build:

```bash
npm run build
npm run start:server
```

## Front-end workflow

The HTML/CSS dashboard remains static. You can open the files directly in a browser or host them with any static server, e.g.:

```bash
npx serve .
```

The scheduler page (`events.html`) now:
- Auto-saves drafts to the `/api/scheduler/save` endpoint (debounced 800 ms)
- Restores drafts on load via `/api/scheduler/saved`
- Submits events and assignments through `/api/scheduler/submit`
- Refreshes the event pipeline using `/api/events`
- Populates the assignee list from `/api/employees`

Ensure the static assets are served from the same origin as the API (or configure `FRONTEND_ORIGIN`).

## Deploying

1. Build the backend container:
   ```bash
   cd server
   docker build -t bartending2u-scheduler-api .
   ```
2. Provide production environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` pointing to PostgreSQL
   - `FRONTEND_ORIGIN=https://your-frontend-domain`
   - `ENABLE_CORS=false`
3. Run database migrations on deploy:
   ```bash
   npm run generate
   npx prisma migrate deploy
   npm run seed   # optional for initial data
   ```
4. Start the container (`docker run`, ECS, Kubernetes, etc.) or deploy via your preferred platform.

## API reference

Full request templates are available in [`Bartending2U-scheduler.postman_collection.json`](./Bartending2U-scheduler.postman_collection.json). Highlights:

- `GET /api/employees` – list employees
- `POST /api/employees` – create employee (validated with Zod)
- `PUT /api/employees/:id` – update employee fields
- `GET /api/events` – list events with optional `status`, `dateFrom`, `dateTo`
- `POST /api/events` – create an event + assignments
- `PUT /api/events/:id` – update event core fields and assignments
- `POST /api/events/:id/assign` – add assignment
- `DELETE /api/events/:id/assign/:assignmentId` – remove assignment
- `POST /api/scheduler/save` – upsert scheduler draft
- `GET /api/scheduler/saved?formKey=` – fetch latest draft
- `DELETE /api/scheduler/saved/:id` – remove draft
- `POST /api/scheduler/submit` – finalize draft, create/update event, and clear draft

Responses follow `{ ok: true, data }` / `{ ok: false, error }` for consistency.

## Continuous integration

GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies, runs Prisma generate/migrate/seed against SQLite, builds the server, and performs a smoke test (`GET /api/employees`).

## Thunder Client / Postman collection

Import [`Bartending2U-scheduler.postman_collection.json`](./Bartending2U-scheduler.postman_collection.json) into Postman or Thunder Client, set the `baseUrl` variable, and use the preconfigured requests to exercise the API endpoints.

## Migration notes

- Initial Prisma migration lives in `server/prisma/migrations/20241003000000_initial/`
- Saved items enforce one draft per `formKey`
- Assignment unique index prevents duplicate employee assignments per event

## Troubleshooting

- Ensure migrations run before launching the server; missing tables will trigger Prisma errors.
- If auto-saving drafts shows validation warnings, confirm required fields (`Event name`, `Date`) are filled.
- For CORS errors in development, set `FRONTEND_ORIGIN` to the static site's origin or run both front-end and API on the same host/port.
