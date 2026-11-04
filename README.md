# ECO-TWIN

A 3D campus map and sustainability app built around RV College of Engineering, Bengaluru.

You can look around campus, report issues with photos, review reports, join challenges and compare basic waste, water and electricity scenarios. It runs locally with a React frontend and Django backend.

![Dark mode](docs/qa/dark-explorer.jpg)

## Features

- 3D campus map with search, location selection, layers, zoom and camera controls.
- Keyboard-accessible 2D map for use without WebGL.
- 55 mapped building footprints, 143 roads/paths, 11 open/green polygons and 4 mapped tree points.
- Separate historical event-map view with 28 numbered locations and one virtual study area.
- Photo reports with a campus zone or optional GPS location.
- Moderator review: Pending → Verified → Assigned → In Progress → Resolved, or Pending → Rejected.
- 10 points per verified report, awarded once.
- Challenges with photo evidence, moderator approval, points and badges.
- Waste, electricity and water calculations, saved scenarios and JSON export.
- Community posts and support votes.
- Campus infrastructure figures with source links.
- Light, dark and system themes; three accent colors; compact layout; larger text; reduced motion; low-power 3D; and a default 2D/3D view.

Display settings are saved in the current browser. Reports, accounts, reviews, points and saved scenarios are stored in the backend database.

## Stack

| Part | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| 3D | Three.js, React Three Fiber, Drei |
| Charts | Chart.js |
| UI | Radix Dialog, Lucide icons, local fonts |
| Backend | Django 5.2, Django REST Framework |
| Database | SQLite for local development |
| Static files | WhiteNoise |

## Run locally

Tested with Node.js 24 and Python 3.13. You also need Git. No external API key is required.

### Install

Open PowerShell:

```powershell
git clone https://github.com/kushalarvindo/Eco-Twin.git
cd Eco-Twin
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe backend/manage.py migrate
.\.venv\Scripts\python.exe backend/manage.py seed --demo
```

### Start

Open two terminals in the project folder.

Backend:

```powershell
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --noreload
```

Frontend:

```powershell
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Keep both terminals running. Stop them with Ctrl+C. Vite forwards API requests to Django on port 8000.

On macOS/Linux, use `.venv/bin/python` in place of the Windows Python path above.

If a port is busy, check whether the app is already running. To change the frontend port, use `npm run dev -- --port 5174` and add that origin to `DJANGO_CSRF_ORIGINS` for authenticated requests. To change the backend port, run Django on another free port and update the proxy target in `vite.config.ts`.

After installation, `./Start-EcoTwin.ps1 -Demo` is an optional Windows shortcut. It starts both servers, checks their URLs and saves logs and process IDs in `.local/`. It refuses ports already in use.

### Demo accounts

`seed --demo` creates two local accounts:

| Role | Username |
| --- | --- |
| Member | `student` |
| Moderator | `moderator` |

The generated password is in `.local/demo-password.txt`. Both newly created accounts use it. The file stays local and is ignored by Git. Seeding again leaves existing passwords unchanged.

You can also register through the app. Moderator access cannot be selected during registration. Run `seed` without `--demo` to add only campus zones and challenge templates.

## Tests and production build

```powershell
npm run check
npm run build
npm test
```

`check` checks TypeScript. `build` creates `dist/`. With Django running, the built app is available at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

`test` runs 14 Django tests with a temporary database and image storage. They cover calculations, invalid inputs, permissions, CSRF, registration, report privacy, image validation, moderation, rewards, scenario ownership, challenge review and voting.

A fresh install, migrations, seeding and build were also checked in a separate checkout. Browser checks covered the main workflows, themes, saved preferences, dialogs and mobile layouts. Details are in [docs/QA.md](docs/QA.md).

The Three.js chunk is about 1.13 MB before gzip. The scene renders on demand, with merged roads and instanced windows. Low-power mode lowers the pixel-ratio limit. Physical low-end-device performance still needs testing.

## Campus data and limits

Building outlines come from OpenStreetMap. Heights use mapped values when present, otherwise floor count × 3.2 m, otherwise a default of 9.6 m. Windows, materials and roofs are approximate.

The model still needs measured heights, current photos, interiors, courtyard holes and a complete tree inventory. Some mapped features include RV University and ongoing construction. The historical event map uses its own approximate coordinates.

No live sensors are connected. Published infrastructure capacities come from dated sources. The calculator uses:

```text
scenario = baseline × (1 − reduction / 100)
```

These are hypothetical reductions. Measured baselines and a calibrated model are still needed for real-world predictions.

The repo includes 30 campus fact records with source links. Contact records and raw document archives are left out. [docs/GEOMETRY.md](docs/GEOMETRY.md) explains the geometry and assumptions.

## Files

```text
frontend/src/       Screens, styles, preferences and 3D/2D maps
backend/config/    Django settings and routes
backend/core/      Models, API, calculations, migrations and tests
RVCE Research/data/facts.json  Public campus facts
scripts/           Test runner, secret checks and geometry conversion
docs/              Data assumptions and test records
.env.example       Configuration placeholders
Start-EcoTwin.ps1  Windows startup script
```

The main API routes are `/api/session/`, `/api/auth/<action>/`, `/api/bootstrap/`, `/api/reports/`, `/api/challenges/`, `/api/reviews/`, `/api/simulations/` and `/api/posts/`. Writes require a session and CSRF token. Moderator permissions are checked by the backend. Evidence images use endpoints with access checks.

## Local files and credentials

Databases, uploads, sessions, logs, `.env`, generated secrets, demo passwords, key files, raw research documents and local handoff notes are excluded from GitHub. The screenshots were taken while signed out and contain no submitted evidence.

Before committing:

```powershell
python scripts/audit_public.py --staged
```

The scanner checks common token formats, key material, private paths, email addresses and excluded files. Review the diff as well; pattern checks cannot catch every possible secret. See [SECURITY.md](SECURITY.md) and [docs/PUBLICATION.md](docs/PUBLICATION.md).

## Hosting

The source is on GitHub. The Django app has not been deployed. GitHub Pages cannot run the Python backend.

A hosted version needs a Python server, HTTPS, a database and persistent private media storage. Build the frontend, apply migrations and seed without demo accounts.

Set these process environment variables:

- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_ORIGINS`
- `MEDIA_ROOT`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` and `POSTGRES_PORT` if using PostgreSQL

`.env.example` lists the variable names and placeholders. It is not loaded automatically. Production mode requires a secret and enables secure cookies, HTTPS redirection and HSTS.

SQLite is tested. PostgreSQL configuration is included, but a production PostgreSQL/PostGIS setup has not been checked. Backups, monitoring, shared throttling, account recovery and data retention still need work before a public campus rollout.

## Credits

Campus geometry: © OpenStreetMap contributors, under the [Open Database License](https://www.openstreetmap.org/copyright). The derived dataset includes source IDs and links.

Institutional figures link to their original sources. The historical map and institutional documents retain their owners' rights. Third-party campus photos and source PDFs are not included.

This is a student project, not an official RVCE service.
