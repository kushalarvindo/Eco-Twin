# Campus geometry and accuracy

Updated 5 November 2026. This document supersedes the original six-block-only modelling plan.

## Geographic model

Source: [OpenStreetMap campus way 55685638](https://www.openstreetmap.org/way/55685638). The original OSM way/node response and surrounding area extract are retained in the local research archive and are not bundled here. The derived geographic database includes source IDs and links. The source API endpoints are `https://api.openstreetmap.org/api/0.6/way/55685638/full` and `https://www.openstreetmap.org/api/0.6/map?bbox=77.49735799999999%2C12.9204817%2C77.50393840000001%2C12.925918399999999`.

The primary OSM API succeeded after the Overpass endpoint returned HTTP 406. No authentication, paywall or TLS protection was bypassed. Data was retrieved on 4 November 2026; that retrieval date does not mean every mapped feature was surveyed then.

`scripts/prepare_campus.py` filters way centroids within the community-mapped campus polygon. It produces `frontend/src/campus-geographic.json`: 55 building ways, 143 road/path ways, 11 open/green ways, and 4 tree nodes. These counts describe mapped features, not an independently audited campus inventory. Shared-campus RV University buildings and construction features remain part of the source context.

The generator uses a documented local equirectangular approximation with origin at the boundary bounding-box centre. X points east, negative Z points north, and one scene unit represents 6 approximate metres. This is suitable for local visualisation, not legal boundary measurement. Latitude/longitude remain attached to database zones and their original OSM source links.

Each building uses its mapped closed-way footprint. Heights follow this order:

1. Explicit OSM `height` tag, if available and numeric.
2. OSM `building:levels` × **assumed 3.2 metres per level**.
3. **Assumed 9.6 metres** where height/levels are absent.

Façade colors, windows, roof appearance and unrecorded details are illustrative. Construction tagging is retained. Mapped outlines can be dated or incomplete; multipolygon courtyards/holes and interiors are not reconstructed. The four tree points do not represent the full tree population. Additional decorative tree rings were removed when geographic data became available.

Named blocks are mapped to stable domain IDs where identity is reasonably supported, including CSE, Civil, Admin, ECE, EEE, IEM, Library, Aerospace/ISE, AI/ML and MINGOS. Unknown buildings retain `osm-<way ID>` identifiers and explicit generic labels. Name matching is not a claim of architectural verification. Road widths use source tags where present, otherwise illustrative defaults; path connectivity is not a tested navigation/routing graph.

The map is a source-grounded geographic reconstruction. An **exact, current replica** still requires authorised plans, survey control points, elevation/height measurements and current façade photography or photogrammetry. Public data alone does not establish that level of fidelity.

## Historical model

`frontend/src/campus-layout.json` digitises approximate rectangles and relationships from the one-page 8th Mile event map retained in the local research archive (not bundled). It contains all 28 legend entries plus one explicit virtual study area. Its coordinates are **map units, not metres**; it has a separate source/geometry policy and is never blended into the geographic geometry as if it were a survey.

Temporary event references, event parking, and neighbouring RV University context remain labeled. This historical mode is useful for comparing known place names, not for claiming current campus layout.

## Simulations and reporting

The studio’s colored footprint is an **illustrative scenario overlay**. It indicates where a linear waste/energy/water scenario applies; it does not calculate physical pollutant dispersion, building energy physics, sunlight, rainwater hydraulics, tree growth or real emissions. Numerical results and assumptions remain accessible outside the 3D canvas.

Open reports associated with a mapped footprint can appear as a selectable amber 3D marker. Reports and locations also remain accessible through lists/forms and a keyboard-operable SVG map. The 2D view is independent of WebGL.

The renderer reuses one merged road geometry and instanced windows, uses demand rendering, and limits pixel ratio to 1–1.5. Renderer diagnostics are exposed as canvas `data-*` attributes for read-only QA. Scene-owned geometries are disposed on teardown. HTML portals inside the Three.js renderer were removed after production navigation testing exposed DOM teardown errors; labels/details live in the standard React interface instead.

## Attribution

© OpenStreetMap contributors. OSM data and the derived geographic database are available under the [Open Database License](https://www.openstreetmap.org/copyright). The derived geographic database and derivation script are included; the raw extract stays in the local archive. This data notice does not change licensing of unrelated project code or other referenced documents.

Historical map and institutional documents retain their original owners’ rights. Public availability is not a grant to republish sponsor artwork or arbitrary campus photographs. Wikimedia Commons metadata was inspected locally for photo references; attempted original/thumbnail downloads returned HTTP 403, so no downloaded photograph is included in the current UI.
