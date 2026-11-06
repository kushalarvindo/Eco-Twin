import data from "./campus-geographic.json";
type Point = number[];
type Segment = {
  a: Point;
  b: Point;
  name: string;
  highway: string;
  wheelchair?: string;
  cuts: { t: number; p: Point }[];
};
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function projection(p: Point, s: Segment) {
  const dx = s.b[0] - s.a[0],
    dy = s.b[1] - s.a[1],
    len = dx * dx + dy * dy;
  const t = len
    ? Math.max(
        0,
        Math.min(1, ((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dy) / len),
      )
    : 0;
  return { t, p: [s.a[0] + t * dx, s.a[1] + t * dy] };
}
function segments(avoidSteps: boolean): Segment[] {
  const result: Segment[] = [];
  for (const r of data.roads) {
    const tags = r.tags as Record<string, string | undefined>;
    if (
      tags.foot === "no" ||
      tags.access === "no" ||
      (avoidSteps && (tags.highway === "steps" || tags.wheelchair === "no"))
    )
      continue;
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i];
      if (distance(a, b) < 0.0001) continue;
      result.push({
        a,
        b,
        name:
          tags.name ||
          ({
            footway: "Campus footpath",
            service: "Shared campus road",
            steps: "Steps",
            pedestrian: "Pedestrian path",
          }[tags.highway ?? ""] ??
            "Campus path"),
        highway: tags.highway ?? "",
        wheelchair: tags.wheelchair,
        cuts: [
          { t: 0, p: a },
          { t: 1, p: b },
        ],
      });
    }
  }
  for (let i = 0; i < result.length; i++)
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i],
        b = result[j],
        rx = a.b[0] - a.a[0],
        ry = a.b[1] - a.a[1],
        sx = b.b[0] - b.a[0],
        sy = b.b[1] - b.a[1];
      const cross = rx * sy - ry * sx;
      if (Math.abs(cross) < 1e-8) continue;
      const qx = b.a[0] - a.a[0],
        qy = b.a[1] - a.a[1],
        t = (qx * sy - qy * sx) / cross,
        u = (qx * ry - qy * rx) / cross;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const p = [a.a[0] + t * rx, a.a[1] + t * ry];
        a.cuts.push({ t, p });
        b.cuts.push({ t: u, p });
      }
    }
  return result;
}
export function networkRoute(fromId: string, toId: string, avoidSteps = false) {
  const from = data.buildings.find((b) => b.id === fromId),
    to = data.buildings.find((b) => b.id === toId);
  if (!from || !to || from === to) return null;
  const roads = segments(avoidSteps);
  const candidates = (p: Point) =>
    roads
      .map((s) => ({ s, ...projection(p, s) }))
      .filter((c) => distance(c.p, p) * 6 <= 60)
      .sort((a, b) => distance(a.p, p) - distance(b.p, p))
      .slice(0, 8);
  const starts = candidates(from.centroid),
    ends = candidates(to.centroid);
  if (!starts.length || !ends.length) return null;
  for (const c of [...starts, ...ends]) c.s.cuts.push(c);
  const nodes = new Map<
    string,
    {
      p: Point;
      edges: {
        to: string;
        length: number;
        name: string;
        steps: boolean;
        knownAccessible: boolean;
      }[];
    }
  >();
  const key = (p: Point) => p.map((v) => v.toFixed(4)).join(",");
  for (const s of roads) {
    s.cuts.sort((a, b) => a.t - b.t);
    for (let i = 1; i < s.cuts.length; i++) {
      const a = s.cuts[i - 1].p,
        b = s.cuts[i].p,
        ka = key(a),
        kb = key(b);
      if (ka === kb) continue;
      if (!nodes.has(ka)) nodes.set(ka, { p: a, edges: [] });
      if (!nodes.has(kb)) nodes.set(kb, { p: b, edges: [] });
      const edge = {
        length: distance(a, b) * 6,
        name: s.name,
        steps: s.highway === "steps",
        knownAccessible: s.wheelchair === "yes",
      };
      nodes.get(ka)!.edges.push({ ...edge, to: kb });
      nodes.get(kb)!.edges.push({ ...edge, to: ka });
    }
  }
  const origin = "building-from",
    target = "building-to";
  nodes.set(origin, { p: from.centroid, edges: [] });
  nodes.set(target, { p: to.centroid, edges: [] });
  for (const [id, centroid, options] of [
    [origin, from.centroid, starts],
    [target, to.centroid, ends],
  ] as const) {
    for (const c of options) {
      const toKey = key(c.p);
      if (!nodes.has(toKey)) continue;
      const edge = {
        length: distance(centroid, c.p) * 6,
        name: "Unverified building connection",
        steps: false,
        knownAccessible: false,
      };
      nodes.get(id)!.edges.push({ ...edge, to: toKey });
      nodes.get(toKey)!.edges.push({ ...edge, to: id });
    }
  }
  const cost = new Map<string, number>([[origin, 0]]);
  const previous = new Map<
      string,
      {
        from: string;
        name: string;
        length: number;
        steps: boolean;
        knownAccessible: boolean;
      }
    >(),
    visited = new Set<string>();
  while (true) {
    let next: string | undefined,
      min = Infinity;
    for (const [id, value] of cost)
      if (!visited.has(id) && value < min) {
        next = id;
        min = value;
      }
    if (!next) return null;
    if (next === target) break;
    visited.add(next);
    for (const e of nodes.get(next)?.edges ?? []) {
      const total = min + e.length;
      if (total < (cost.get(e.to) ?? Infinity)) {
        cost.set(e.to, total);
        previous.set(e.to, { ...e, from: next });
      }
    }
  }
  const points: Point[] = [to.centroid],
    legs: { name: string; metres: number }[] = [];
  let cursor = target,
    steps = false,
    unknown = false;
  while (cursor !== origin) {
    const prev = previous.get(cursor)!;
    legs.unshift({ name: prev.name, metres: prev.length });
    steps ||= prev.steps;
    unknown ||= !prev.knownAccessible;
    cursor = prev.from;
    points.unshift(nodes.get(cursor)!.p);
  }
  const startConnector = legs[0]?.metres ?? 0,
    endConnector = legs.at(-1)?.metres ?? 0;
  legs.shift();
  legs.pop();
  const walkMeters = Math.round(cost.get(target) ?? 0);
  const directions = legs.reduce<{ name: string; metres: number }[]>(
    (all, leg) => {
      if (all.at(-1)?.name === leg.name)
        all[all.length - 1].metres += leg.metres;
      else all.push({ ...leg });
      return all;
    },
    [],
  );
  return {
    from,
    to,
    points,
    walkMeters,
    walkMinutes: Math.round((walkMeters / 72) * 10) / 10,
    straightMeters: Math.round(distance(from.centroid, to.centroid) * 6),
    calories: Math.round(walkMeters * 0.05),
    avoidedCarbonGrams: Math.round(walkMeters * 0.14),
    startConnector: Math.round(startConnector),
    endConnector: Math.round(endConnector),
    directions,
    steps,
    unknown,
  };
}
