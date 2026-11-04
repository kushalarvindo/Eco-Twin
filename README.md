# ECO-TWIN

### Explore the campus. Try a change. See what it could mean.

ECO-TWIN is my campus sustainability project built around RV College of Engineering, Bengaluru. I wanted a place where exploring the campus, reporting an issue and trying a small environmental change feel connected.

The current version runs locally with a React + TypeScript frontend, a Three.js campus explorer and a Django REST backend. Reports, reviews, points, challenge participation, community suggestions and saved scenarios are stored in the database.

![ECO-TWIN campus explorer in dark mode](docs/qa/dark-explorer.jpg)

## What you can do

- **Explore RVCE in 3D or 2D.** Search locations, select footprints, switch layers, zoom, reset the camera or use the top view. The geographic dataset contains 55 building footprints, 143 road/path features, 11 open/green polygons and 4 mapped tree points.
- **Compare references.** A separate historical event-map view contains 28 numbered references and one clearly marked virtual study area.
- **Report something that needs attention.** Add a photo and location, use optional GPS or pick a zone manually, then follow the review history. Pending evidence is restricted to its author and moderators.
- **Review issues.** Moderators can verify, assign, progress, resolve or reject reports. Verification gives 10 points once, backed by a unique reward event.
- **Try a what-if scenario.** Compare waste, electricity and water reductions, see a zone overlay, save a scenario to your account or export it as JSON.
- **Join challenges.** Submit photo evidence, get it reviewed and earn points and badges.
- **Share suggestions.** Post to the community and support an idea with a vote.
- **Check the sources.** Published infrastructure figures link to their evidence and are separated from missing live measurements.
- **Make the workspace yours.** Light, dark or system appearance; forest, ocean or clay accents; compact or comfortable layout; larger text; reduced motion; low-power 3D rendering; and a default 2D/3D view. Preferences stay in this browser on this device.

## A quick reality check

The campus model uses public OpenStreetMap footprints. It is a useful geographic reconstruction, but it is **not an exact architectural replica**. Heights use mapped values where available, otherwise mapped floor counts × an assumed 3.2 m, otherwise an assumed 9.6 m. Windows, materials and roof details are illustrative. Interiors, courtyard holes, complete tree coverage and current construction details still need better references.

The historical map stays separate because it uses approximate map units rather than measured coordinates. Shared RV University context and temporary event references are labeled. See [the geometry notes](docs/GEOMETRY.md) for the projection, assumptions and source links.

There are **no connected live sensors**. Published capacities are historical source claims, not today's usage. The scenario calculator uses simple linear reductions; it is not a calibrated environmental prediction. I would need measured baselines and authorised campus data before claiming that.

## Stack

| Part | Used here |
| --- | --- |
| Interface | React 19, TypeScript, Vite, React Router |
| Campus scene | Three.js, React Three Fiber, Drei |
| Charts and dialogs | Chart.js, Radix Dialog, Lucide icons |
| Backend | Django 5.2, Django REST Framework |
| Local database | SQLite |
| Static build | Vite output served through Django / WhiteNoise |

Fonts are bundled locally. Python handles scenario calculations and server-side permissions. SQLite is the tested database; PostgreSQL configuration is available but a production PostgreSQL/PostGIS setup has not been verified.

## Run it on your machine

Development was checked with **Node.js 24, Python 3.13 and Git**. No external API key is needed to run the local version.

```powershell
git clone https://github.com/kushalarvindo/Eco-Twin.git
cd Eco-Twin
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe backend/manage.py migrate
.\.venv\Scripts\python.exe backend/manage.py seed --demo
```

Open two VS Code terminals in the `Eco-Twin` folder.

**Terminal 1 — backend**

```powershell
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --noreload
```

**Terminal 2 — frontend**

```powershell
npm run dev
```

Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**. Keep both terminals running. Vite forwards `/api` requests to Django on port 8000. Stop a server with Ctrl+C. Opening `index.html` directly will not work.

If a port is occupied, first check whether ECO-TWIN is already running. For another frontend port, use `npm run dev -- --port 5174`. For another backend port, run Django on 8001 and update the Vite proxy target in `vite.config.ts` to match. Add the new frontend origin to `DJANGO_CSRF_ORIGINS` when using authenticated writes.

On macOS/Linux, create the same `.venv`, then use `.venv/bin/python` instead of `.\.venv\Scripts\python.exe` in these commands.

After installation, Windows users can alternatively run `./Start-EcoTwin.ps1 -Demo`. It starts both servers hidden, checks HTTP availability and records its process IDs and logs in `.local/`. It refuses ports already in use. Close only the printed process IDs after checking they still belong to this project.

### Local demo accounts

`seed --demo` creates `student` and `moderator` only in local DEBUG mode. A random password is generated and saved to **`.local/demo-password.txt`** on your machine. It is not printed, committed or sent anywhere. Both newly created demo accounts use that password. Re-running the command does not reset an existing account's password.

You can also register through the interface. Registration cannot grant moderator access. Use `seed` without `--demo` when you only want campus zones and challenge templates. Do not deploy demo accounts publicly.

## Check and build

```powershell
npm run check
npm run build
npm test
```

- `check` runs TypeScript checks.
- `build` creates `dist/`. With the backend running, the compiled app is available at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).
- `test` runs 14 Django tests using a temporary database and temporary media storage. It requires the `.venv` above and does not clear your local application database.

Tests cover calculation boundaries, permissions, CSRF, registration, report privacy, file validation and metadata removal, moderation transitions, unique rewards, saved-scenario ownership, challenge review and vote toggling. Browser checks cover the main workflows, production navigation, responsive layouts and display preferences. See [QA notes and limits](docs/QA.md).

The Three.js dependency chunk is still large (about 1.13 MB before gzip in the checked build). Scene and chart modules are split, demand rendering avoids an idle animation loop, and low-power mode limits pixel ratio. This is not a low-end-device performance certification.

## Project layout

```text
frontend/src/       React screens, themes, preferences and campus scenes
backend/config/    Django settings and URL routing
backend/core/      Models, permissions, API, calculator, migrations and tests
RVCE Research/data/facts.json  Curated source-linked public campus facts
scripts/           Test runner and optional geometry conversion script
public/            Favicon
docs/              Geometry, verification and publication notes
.env.example       Environment variable names and placeholders only
Start-EcoTwin.ps1  Optional Windows startup helper
```

The API includes `/api/session/`, `/api/auth/<action>/`, `/api/bootstrap/`, `/api/reports/`, `/api/challenges/`, `/api/reviews/`, `/api/simulations/` and `/api/posts/`. Mutations use session authentication and CSRF protection; moderation permissions are checked on the server. Uploaded evidence is served through permission-checked endpoints, rather than a public media directory.

## What is kept out of GitHub

The public source checkout excludes local databases, uploaded evidence, account/session data, `.env` files, generated secrets, demo passwords, public/private key files, logs, local handoff notes, machine-specific paths and the raw research/document archives. The public fact catalogue omits contact records. Screenshots are taken while signed out.

The original research archive and local agent notes stay in the development workspace. The application runs from the curated data included here. The optional geometry conversion script expects the original OSM reference and area extract locally; running the website does not need those raw files. [Publication notes](docs/PUBLICATION.md) explain the reviewed scope. [Security notes](SECURITY.md) explain the local defaults and deployment boundary.

## Deployment status

This repository publishes the **source code**. It does not automatically host the Django application, and GitHub Pages cannot run its Python backend.

For an actual deployment, build the frontend, apply migrations, seed without demo accounts and use a Python-capable host with HTTPS, a production WSGI server, a database and persistent private media storage. Configure the process environment using the names in `.env.example`; Django does not automatically read that file.

- `DJANGO_DEBUG=0`
- A new `DJANGO_SECRET_KEY`, generated and stored on the host
- Correct `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_ORIGINS`
- `MEDIA_ROOT` pointing to private persistent storage
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` and `POSTGRES_PORT` if using PostgreSQL

Production mode refuses to start without a secret and enables secure cookies, HTTPS redirection and HSTS. The development server is for local use. Shared throttling/cache, monitoring, backups, account recovery and a retention/moderation policy still need deployment-specific work before a public institutional launch.

## Where I want to take this

Better measured building heights and façade references, a fuller tree inventory, authorised environmental baselines, calibrated simulations and a properly tested hosted pilot. The current version is a working foundation for those steps. It is not presented as an official RVCE service.

## Sources and credits

Campus geometry: **© OpenStreetMap contributors**, available under the [Open Database License](https://www.openstreetmap.org/copyright). The derived geographic dataset, source IDs and transformation policy are included. Institutional figures retain links and evidence notes in the fact catalogue; conflicting claims stay marked.

The historical event map and institutional documents retain their owners' rights. No third-party campus photographs or source PDFs are bundled in the public repository. The current UI uses original vector illustrations and the mapped geometry.
