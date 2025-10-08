# Bartending2U Scheduler Enhancements

## Employee API & Modal

This update introduces a Prisma-backed API for employee data along with an interactive employee detail modal on the roster page.

### Running the server

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm run dev:server
```

The dev server loads environment variables from `.env` (see `.env.example` for defaults). By default it listens on port `4000`.

### Seeding the database

The `pnpm prisma db seed` command populates the SQLite database with sample employees, events, and assignments that match the UI demo data.

### Testing the modal and deep links

1. Start the dev server as above.
2. Open `employees.html` in your browser (served from your preferred static file host).
3. Click any employee tile (class `.employee-card`) to open the modal.
4. Refresh the page while the modal is open or navigate to `employees.html?id=<employeeId>` to confirm deep link support.
5. Use the close button or browser back button to exit the modal and verify the URL updates correctly.

## Events API (FastAPI backend)

The event pipeline now uses a lightweight FastAPI service backed by SQLite. The API automatically creates `events.db` in the
project root on startup and exposes CRUD endpoints at `http://127.0.0.1:8000/events`.

### Python setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Running the API locally

```bash
uvicorn server:app --reload --port 8000
# or use the npm script
pnpm run dev:api
```

Optional environment variables:

- `EVENTS_DB_PATH` – override the SQLite file location (default: `events.db` in the repo root).

### API quick check

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/events
```

### Tests

```bash
pytest test_api.py
```

The tests perform a create → list → update → delete flow and confirm data persists across an app restart.
