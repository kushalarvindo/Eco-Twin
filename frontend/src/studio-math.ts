import campus from "./campus-geographic.json";
import * as SunCalc from "suncalc";

export type MapPoint = [number, number, number];
export type ProposalObject = {
  id: string;
  kind: "tree" | "bin" | "solar" | "tank";
  point: MapPoint;
  rotation: number;
};
export type Proposal = { id: string; name: string; objects: ProposalObject[] };
export function inside(point: number[], polygon: number[][]) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}
export function mapCoordinates(point: MapPoint) {
  const [lon, lat] = campus.origin_lon_lat;
  return {
    latitude: lat - (point[2] * 6) / 111320,
    longitude:
      lon + (point[0] * 6) / (111320 * Math.cos((lat * Math.PI) / 180)),
  };
}
export function sceneCoordinates(
  latitude: number,
  longitude: number,
): MapPoint {
  const [lon, lat] = campus.origin_lon_lat;
  return [
    ((longitude - lon) * 111320 * Math.cos((lat * Math.PI) / 180)) / 6,
    0,
    ((lat - latitude) * 111320) / 6,
  ];
}
function distanceToEdge(p: number[], a: number[], b: number[]) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = dx * dx + dz * dz;
  const t = len
    ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / len))
    : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
export function walkable(x: number, z: number) {
  const point = [x, z];
  if (!inside(point, campus.boundary)) return false;
  return !campus.buildings.some(
    (b) =>
      inside(point, b.points) ||
      b.points.some(
        (a, i) =>
          distanceToEdge(point, a, b.points[(i + 1) % b.points.length]) < 0.12,
      ),
  );
}
export function walkStart(id: string): MapPoint {
  const b = campus.buildings.find((b) => b.id === id) ?? campus.buildings[0];
  const options = campus.roads
    .flatMap((r) => r.points)
    .filter(([x, z]) => walkable(x, z));
  const p = options.sort(
    (a, c) =>
      Math.hypot(a[0] - b.centroid[0], a[1] - b.centroid[1]) -
      Math.hypot(c[0] - b.centroid[0], c[1] - b.centroid[1]),
  )[0];
  return p ? [p[0], 1.7 / 6, p[1]] : [0, 1.7 / 6, 0];
}
export function polygonArea(points: MapPoint[]) {
  return (
    Math.abs(
      points.reduce((total, p, i) => {
        const q = points[(i + 1) % points.length];
        return total + p[0] * q[2] - q[0] * p[2];
      }, 0),
    ) * 18
  );
}
export function pathDistance(points: MapPoint[]) {
  return points.reduce(
    (total, p, i) =>
      i
        ? total +
          Math.hypot(
            p[0] - points[i - 1][0],
            p[1] - points[i - 1][1],
            p[2] - points[i - 1][2],
          ) *
            6
        : 0,
    0,
  );
}
export function sunPosition(date: string, hour: number) {
  const time = new Date(
    date +
      "T" +
      String(Math.floor(hour)).padStart(2, "0") +
      ":" +
      String(Math.round((hour % 1) * 60)).padStart(2, "0") +
      ":00+05:30",
  );
  if (!Number.isFinite(time.getTime()) || hour < 0 || hour > 23.75)
    throw new Error("Choose a valid date and time.");
  const sun = SunCalc.getPosition(
    time,
    campus.origin_lon_lat[1],
    campus.origin_lon_lat[0],
  );
  const az = (sun.azimuth * Math.PI) / 180,
    alt = (sun.altitude * Math.PI) / 180;
  return {
    ...sun,
    vector: [
      Math.sin(az) * Math.cos(alt) * 100,
      Math.sin(alt) * 100,
      -Math.cos(az) * Math.cos(alt) * 100,
    ] as [number, number, number],
  };
}
export function validProposal(value: unknown): value is Proposal {
  if (!value || typeof value !== "object") return false;
  const p = value as Proposal;
  return (
    typeof p.id === "string" &&
    p.id.length <= 80 &&
    typeof p.name === "string" &&
    p.name.length > 0 &&
    p.name.length <= 100 &&
    Array.isArray(p.objects) &&
    p.objects.length <= 40 &&
    new Set(p.objects.map((o) => o?.id)).size === p.objects.length &&
    p.objects.every(
      (o) =>
        o &&
        typeof o.id === "string" &&
        o.id.length <= 80 &&
        ["tree", "bin", "solar", "tank"].includes(o.kind) &&
        Array.isArray(o.point) &&
        o.point.length === 3 &&
        o.point.every(Number.isFinite) &&
        inside([o.point[0], o.point[2]], campus.boundary) &&
        o.point[1] >= 0 &&
        o.point[1] < 30 &&
        Number.isFinite(o.rotation) &&
        Math.abs(o.rotation) <= 360,
    )
  );
}
