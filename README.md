# ECO-TWIN

An environmental digital twin for RV College of Engineering, Bengaluru, built with React, Three.js and Django.

ECO-TWIN provides an interactive campus map, photo-based issue reporting, moderator review and waste, water and energy scenario calculations.

![Campus explorer](docs/qa/dark-explorer.jpg)

## Features

| Module | Functionality |
| --- | --- |
| Campus explorer | Geographic 3D model, keyboard-accessible 2D map, location search, layers and camera controls |
| 3D tools | Ground-level walking, proposal comparison, sun/shade, report pins, floor cutaway, measurements and local panoramas |
| Issue reporting | Photo uploads, campus zones, optional GPS coordinates and status history |
| Moderation | Verification, assignment, progress tracking, resolution and rejection |
| Scenario analysis | Waste, electricity and water reductions, chart comparisons, saved scenarios and JSON export |
| Challenges | Participation, evidence submission, moderator review, points and badges |
| Community | Location-based suggestions and support votes |
| Display settings | Light/dark/system themes, three accent colors, layout density, text size, reduced motion and low-power rendering |

Report verification awards 10 points through a unique reward record. Accounts, reports, reviews and scenarios persist in the backend database. Display preferences are stored in the browser.

## Architecture

| Layer | Implementation |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| Rendering | Three.js, React Three Fiber, Drei |
| Charts | Chart.js |
| Components | Radix Dialog, Lucide icons |
| API | Django 5.2, Django REST Framework |
| Database | SQLite; optional PostgreSQL configuration |
| Static assets | WhiteNoise |

Vite proxies API requests to Django during development. A production frontend build can also be served by Django. The renderer uses on-demand frames, merged road geometry and instanced windows.

## Development setup

### Requirements

- Node.js 24
- Python 3.13
- Git

### Installation

```powershell
git clone https://github.com/kushalarvindo/Eco-Twin.git
cd Eco-Twin

npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe backend/manage.py migrate
.\.venv\Scripts\python.exe backend/manage.py seed
```

### Start the application

Run the backend and frontend in separate terminals from the project root.

**Backend**

```powershell
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000 --noreload
```

**Frontend**

```powershell
npm run dev
```

Open [localhost:5173](http://127.0.0.1:5173/). The API runs on port 8000. Stop either process with Ctrl+C.

On macOS and Linux, replace the Windows Python executable with `.venv/bin/python`.

The Windows helper `./Start-EcoTwin.ps1 -Demo` starts both services and checks their availability. If a port is occupied, use the existing service or select another port. Frontend port changes require a matching `DJANGO_CSRF_ORIGINS` entry; backend port changes require updating the proxy in `vite.config.ts`.

### Demo accounts

To create local member and moderator accounts:

```powershell
.\.venv\Scripts\python.exe backend/manage.py seed --demo
```

| Role | Username |
| --- | --- |
| Member | `student` |
| Moderator | `moderator` |

The generated password is stored in `.local/demo-password.txt`. Existing account passwords are preserved when the command is repeated. Demo seeding is available only in DEBUG mode. Registration through the application creates member accounts.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run check` | TypeScript validation |
| `npm run build` | Generate the frontend build in `dist/` |
| `npm test` | Run the Django test suite |
| `npm run format` | Format frontend source files |

After `npm run build`, Django serves the compiled application at [localhost:8000](http://127.0.0.1:8000/).

The backend suite covers calculations, authentication, CSRF, report visibility, upload validation, moderation transitions, reward uniqueness, scenario ownership, challenge review and voting. See [Testing](docs/QA.md) for results and browser coverage.

## Campus model and data

The geographic dataset contains 55 building footprints, 143 road/path features, 11 open/green polygons and 4 mapped tree points. A separate historical event-map view contains 28 numbered references and one virtual study area.

Building outlines are derived from OpenStreetMap. Heights use mapped values when available, mapped floor counts × 3.2 m otherwise, and a 9.6 m fallback. Facades, windows and roofs are approximate. The model does not include surveyed interiors or a complete tree inventory.

Campus infrastructure data consists of 37 source-linked records. Published capacities retain their source dates and conflict notes. Live environmental telemetry is not connected.

Scenario calculations apply a linear reduction to the supplied baseline:

```text
scenario = baseline × (1 − reduction / 100)
```

Results describe the selected assumptions. They are not calibrated forecasts. See [Campus geometry](docs/GEOMETRY.md) for data sources, coordinate systems and modelling details.

## Repository structure

```text
frontend/src/       UI, themes, campus datasets and scene components
backend/config/    Django configuration and URL routing
backend/core/      Models, API, calculations, migrations and tests
RVCE Research/data/facts.json
                   Campus records and source references
scripts/           Development and data-processing utilities
docs/              Geometry specification and test results
public/            Static assets
```

## Configuration

Django reads process environment variables. The supported settings are listed in `.env.example`.

| Variable | Purpose |
| --- | --- |
| `DJANGO_DEBUG` | Development mode; set to `0` for deployment |
| `DJANGO_SECRET_KEY` | Django signing key; required in production |
| `DJANGO_ALLOWED_HOSTS` | Allowed hostnames, comma-separated |
| `DJANGO_CSRF_ORIGINS` | Trusted request origins, comma-separated |
| `MEDIA_ROOT` | Persistent upload directory |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | PostgreSQL connection settings |

The default development database is SQLite. PostgreSQL configuration is available; production PostgreSQL/PostGIS integration has not been validated.

Deployment requires a Python WSGI server, HTTPS and persistent database/media storage. Build the frontend, apply migrations and seed without demo accounts. The application has not been deployed to a hosted environment.

Authentication and upload handling are documented in [SECURITY.md](SECURITY.md).

## Attribution

Campus geometry: © OpenStreetMap contributors, licensed under the [Open Database License](https://www.openstreetmap.org/copyright). Source identifiers and links are included in the derived dataset.

Institutional records link to their original sources. The historical map remains the property of its original publisher.

## Campus references and scenario templates

The geographic explorer displays building names on hover and selection, estimated footprint areas and height provenance. Nearby Street View opens in Google Maps; coverage depends on the location. The administration detail includes a historical photograph by [Rvian00 (2009)](https://commons.wikimedia.org/wiki/File:RV_College_Admin_block.JPG), licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), displayed with CSS cropping.

Six editable templates cover waste segregation, composting, lighting, equipment shutdown, leaks and efficient water fixtures. Saved scenarios can be copied into variants. Monthly and annual projections assume constant daily inputs. Template percentages are examples, not measured intervention performance.

In **Campus explorer → Campus layer**, choose footprint area, estimated height, or open reports (all categories, waste, water or energy). Both maps use the same four color bands. The legend shows the number of buildings in each band and the three highest positive values. Report layers count records assigned to mapped buildings across all reports visible to the current user that were opened during the selected period.

### Reports and electricity records

The report period applies to both campus maps and the selected building. The weekly chart counts submissions by creation date and resolutions by status-change date, in campus local time. Older submissions can contribute a resolution in the selected period. The Environment page lists the geometry and photo sources for each building. The What-if studio compares up to three saved scenarios with compatible units.

To load an authorised electricity log, run migrations and import a CSV from the project root using the project Python environment:

```sh
python backend/manage.py migrate
python backend/manage.py import_electricity path/to/readings.csv
```

Use the header `zone,meter,timestamp,unit,kind,value,source`. The zone is the building ID. Supply a public-safe meter label and source description as both appear on the dashboard. Use `kWh` and a campus-midnight ISO timestamp with UTC offset (for example `2026-10-02T00:00:00+05:30`). A `daily` value is consumption during the preceding day. A `cumulative` value is the meter register at midnight. The chart derives consumption from consecutive register readings, leaves missing intervals and resets blank, and preserves measured zeroes. It shows the latest 30 days for each meter and the number of days included in each weekly sum. Reimporting identical readings is safe. A conflicting reading rolls back the whole file. Keep original logs outside the repository.

## Field observations and repair checks

The campus explorer includes a rainwater estimate for each mapped roof and a field-survey form. Signed-in users can submit names, measured heights, entrances, ramps and barriers with photographs. A different moderator reviews submissions. Approved observations appear in the reviewed records; updating the mapped geometry remains a separate review step.

To resolve a new report, a moderator attaches an after-repair photograph. The reporter can confirm the repair or request follow-up. Follow-up returns the report to Verified and preserves the history. Existing resolved records remain readable even when they predate repair photographs.

Walking directions follow a graph built from the bundled road and path segments. The “Avoid mapped steps” option removes recorded step segments. Building connections are approximate and gate hours, obstructions and full accessibility require on-site checks. The map shows the selected path in both 2D and 3D. A disconnected destination shows an unavailable-route message.

Rainwater collection uses projected footprint area, connected roof percentage, event rainfall in millimetres and collection efficiency. One mm over one m² is one litre. The result describes potential collection before tank-capacity limits.

The existing Debug Mode menu selects browser-only sample reports and personas. Map counts and weekly history use that same sample dataset and date range. Sample scenarios and edits persist for the browser tab session. Real API permissions still apply to campus records. Leave sample mode to submit surveys, evidence or community changes.

Run the routing and sample-filter regression checks with:

```sh
npm run test:routes
```

## 3D tools

Select a mode from **Campus explorer → 3D tools**. These modes use the geographic model.

| Mode | Controls |
| --- | --- |
| Walk at ground level | WASD or on-screen buttons to move, drag to look, Esc to return. The small map shows your position and selected route. Building outlines and the campus boundary stop movement. |
| Before and after editor | Choose a tree, bin, solar array or tank, then click the map. Drag the comparison divider. Save locally or export/import a proposal as JSON. Expand object controls to move, rotate or remove items. |
| Sun and shade | Choose a date and Bengaluru time. SunCalc calculates sun position; shadows use the model's estimated heights. |
| Place a report pin | Click the map, then open the report form. Coordinates are private to the author and moderators unless the author opts into sharing. Public visibility also requires report verification. |
| Measure distance or area | Click points for a path length or horizontal area. Undo and clear controls are available. Values use the approximate 6 m model scale. |
| Building cutaway | Select a building and floor level. The view clips the roof and walls and shows estimated floor plates at 3.2 m spacing. Rooms and stairs need verified plans. |
| 360° viewpoints | Open nearby Google Street View or load a local 2:1 JPEG/PNG panorama. Link loaded viewpoints with clickable hotspots. Local images stay in the browser and clear when the explorer closes. |

Proposals support 40 objects each and 20 local saves. They do not calculate structural suitability or environmental savings. Measurements are approximate; area is projected onto the horizontal plane. Sun/shade excludes weather and tree-canopy effects.

The photo gallery contains credited photographs of Admin (2009), the campus near Mechanical Engineering (2009), and Sir M Visvesvaraya Hostel (2012). All are licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); individual sources and changes are recorded in `frontend/src/photo-credits.json`. Admin fins/canopy and hostel balcony details are approximate visual references. Current CSE/library facades, surveyed interiors and a reusable RVCE panorama are still needed for a closer replica. Street View opens on Google Maps and depends on its coverage.

Run the 3D calculation and import checks with:

```sh
npm run test:studio
```
