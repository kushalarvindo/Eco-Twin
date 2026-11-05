import data from "./campus-geographic.json";
import type { Report } from "./types";

export const hotspotModes = {
  footprint: "Building footprint",
  height: "Building height",
  solar: "Solar rooftop potential",
  issues: "All open issues",
  waste: "Waste reports",
  water: "Water reports",
  energy: "Energy reports",
} as const;

export function footprintArea(points: number[][]) {
  const twiceArea = points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length];
    return sum + a[0] * b[1] - b[0] * a[1];
  }, 0);
  return Math.abs(twiceArea) * 18; // Coordinates use six metres per unit.
}

export function hotspotLayer(mode: string, reports: Report[]) {
  if (!Object.prototype.hasOwnProperty.call(hotspotModes, mode)) return null;
  const area = mode === "footprint";
  const height = mode === "height";
  const solar = mode === "solar";
  const category = { waste: "Waste", water: "Water", energy: "Energy" }[mode];
  const counts = new Map<string, number>();
  for (const r of reports) {
    if (
      r.status === "Rejected" ||
      r.status === "Resolved" ||
      (category && r.category !== category)
    )
      continue;
    counts.set(r.zone, (counts.get(r.zone) ?? 0) + 1);
  }
  const cuts = area
    ? [500, 1000, 2000]
    : height
      ? [7, 10, 15]
      : solar
        ? [25, 55, 100]
        : [1, 3, 6];
  const labels = area
    ? ["<500", "500–<1,000", "1,000–<2,000", "≥2,000"]
    : height
      ? ["<7", "7–<10", "10–<15", "≥15"]
      : solar
        ? ["<25", "25–<55", "55–<100", "≥100"]
        : ["0", "1–2", "3–5", "6+"];
  const colors = ["#e4e8df", "#ffc66b", "#e96536", "#952445"];
  const bins = labels.map((label, i) => ({
    label,
    color: colors[i],
    count: 0,
  }));
  const unit = area ? "m²" : height ? "m" : solar ? "kWp" : "reports";
  const rows = data.buildings
    .map((b) => {
      const value = area
        ? footprintArea(b.points)
        : height
          ? b.height_m
          : solar
            ? Math.round(footprintArea(b.points) * 0.6 * 0.18 * 10) / 10
            : (counts.get(b.id) ?? 0);
      const bin = cuts.filter((c) => value >= c).length;
      bins[bin].count++;
      return {
        id: b.id,
        name: b.name,
        value,
        color: colors[bin],
        label: solar
          ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWp (~${Math.round(value * 4.8)} kWh/day)`
          : value.toLocaleString(undefined, {
              maximumFractionDigits: height ? 1 : 0,
            }) +
            " " +
            unit,
      };
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return {
    title: hotspotModes[mode as keyof typeof hotspotModes],
    unit,
    bins,
    rows,
    byId: new Map(rows.map((r) => [r.id, r])),
    note: area
      ? "Ground area enclosed by each OpenStreetMap building outline."
      : height
        ? "Estimated heights use mapped floor counts or a default height."
        : solar
          ? "Rooftop solar capacity potential derived from mapped footprint area assuming 60% usable rooftop space and 180 Wp/m² panel rating. Campus total installed capacity is 500 kWp."
          : "Counts open reports at mapped buildings in the latest 200 reports visible to you. Zero means no matching report in this set.",
  };
}
export type Hotspots = ReturnType<typeof hotspotLayer>;
