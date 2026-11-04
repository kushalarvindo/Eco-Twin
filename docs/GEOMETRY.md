# Campus geometry

## Sources

| Dataset | Reference |
| --- | --- |
| Geographic boundary and features | [OpenStreetMap campus way 55685638](https://www.openstreetmap.org/way/55685638) and surrounding map extract |
| Historical layout | 8th Mile campus event map |

The OSM extract was retrieved on 4 November 2026. Individual features may reflect earlier mapping.

`frontend/src/campus-geographic.json` contains the derived geographic dataset. `frontend/src/campus-layout.json` contains the independent historical layout.

## Feature inventory

| Feature | Count |
| --- | --- |
| Building footprints | 55 |
| Roads and paths | 143 |
| Open/green polygons | 11 |
| Tree points | 4 |
| Historical numbered references | 28 |
| Virtual historical study areas | 1 |

The inventory includes mapped RV University buildings and construction features within the campus boundary. Tree points represent the available mapping, not the campus tree population.

## Coordinate system

The geographic model uses a local equirectangular approximation centered on the boundary bounding box.

```text
x = (longitude − origin_longitude) × 111320 × cos(origin_latitude) / 6
z = −(latitude − origin_latitude) × 111320 / 6
```

X points east; negative Z points north. One scene unit represents approximately 6 metres. This projection supports campus visualization, not cadastral measurement.

The generator retains ways whose centroids lie inside the campus polygon. Original OSM identifiers and source links remain attached to derived features.

## Building heights

Heights are assigned in this order:

1. Numeric OSM `height` value.
2. OSM `building:levels` multiplied by 3.2 metres.
3. A default height of 9.6 metres.

Mapped closed-way footprints determine the building outlines. Facades, window placement, roof details and fallback heights are approximate. Multipolygon courtyard holes and interiors are not reconstructed.

Named features map to stable application zone IDs where a correspondence is available. Unmatched buildings retain `osm-<way ID>` identifiers. Road widths use mapped values where available and default widths otherwise. Road connectivity is not a routing network.

## Historical layout

The historical model uses approximate map units. Its coordinates are independent of the geographic projection. Temporary event locations, parking and neighboring RV University references retain their labels.

The additional planting study area is virtual and does not represent a surveyed garden.

## Scenario overlays

The scenario overlay highlights the selected footprint and reduction percentage. Numerical results use the linear model in `backend/core/simulation.py`. The overlay does not calculate spatial dispersion, building energy demand or water flow.

Reports can appear as selectable markers linked to campus zones. Location selection is also available through lists and the SVG 2D map.

## Renderer

The scene uses on-demand rendering, merged road geometry and instanced windows. Balanced rendering limits pixel ratio to 1–1.5; low-power mode uses 1. Scene-owned geometry is disposed on teardown.

Labels and details are rendered in the React interface outside the canvas. Renderer metrics are exposed through `data-render-frames`, `data-draw-calls` and `data-triangles` canvas attributes.

## Regeneration

`scripts/prepare_campus.py` requires the original local source inputs:

- `RVCE Research/data/osm_campus_reference.json`
- `RVCE Research/data/osm_campus_area.osm`

Source endpoints:

- [Campus way and nodes](https://api.openstreetmap.org/api/0.6/way/55685638/full)
- [Surrounding map extract](https://www.openstreetmap.org/api/0.6/map?bbox=77.49735799999999%2C12.9204817%2C77.50393840000001%2C12.925918399999999)

Run the conversion script from the repository root after placing the inputs at the paths above. The committed derived dataset is sufficient to run the application.

Higher geometric accuracy requires surveyed dimensions, elevation data and current photographic references.

## Attribution

© OpenStreetMap contributors. The OSM-derived geographic database is available under the [Open Database License](https://www.openstreetmap.org/copyright).

The historical event map remains the property of its original publisher.
