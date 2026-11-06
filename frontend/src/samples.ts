import { useSyncExternalStore } from "react";
import {
  DEMO_REPORTS_50,
  DEMO_CLIENT_STUDENT,
  DEMO_CLIENT_MODERATOR,
} from "./demo-data";
import type { Report, Saved } from "./types";
import type { HistoryData } from "./Insights";
type SampleReport = Report & { sample: true };
const initial = () =>
  structuredClone(DEMO_REPORTS_50).map((r) => ({
    ...r,
    sample: true as const,
  }));
let state = {
  active: localStorage.getItem("ecotwin_debug_mode") === "true",
  role: "student",
  reports: initial().slice(0, 10),
  saved: [] as Saved[],
};
try {
  const stored = JSON.parse(
    sessionStorage.getItem("ecotwin.sample-session.v1") ?? "null",
  );
  if (stored && Array.isArray(stored.reports) && Array.isArray(stored.saved))
    state = {
      ...state,
      role: stored.role,
      reports: stored.reports,
      saved: stored.saved,
    };
} catch {}
const listeners = new Set<() => void>();
export function sampleState() {
  return state;
}
export function setSample(update: Partial<typeof state>) {
  state = { ...state, ...update };
  localStorage.setItem("ecotwin_debug_mode", String(state.active));
  try {
    sessionStorage.setItem("ecotwin.sample-session.v1", JSON.stringify(state));
  } catch {}
  listeners.forEach((fn) => fn());
}
export function useSample() {
  return useSyncExternalStore((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, sampleState);
}
export function sampleUser() {
  const user =
    state.role === "moderator"
      ? DEMO_CLIENT_MODERATOR
      : state.role === "student"
        ? DEMO_CLIENT_STUDENT
        : null;
  return user
    ? {
        ...user,
        reports: state.reports.filter((r) => r.mine).length,
        challenges: 0,
      }
    : null;
}
export function updateSampleReport(report: Report) {
  setSample({
    reports: state.reports.map((r) =>
      r.id === report.id ? { ...structuredClone(report), sample: true } : r,
    ),
  });
}
export function addSampleReport(report: Report) {
  setSample({ reports: [{ ...report, sample: true }, ...state.reports] });
}
export function sampleHistory(
  reports: Report[],
  zone: string,
  days: string,
  category: string,
  page: number,
): HistoryData {
  const day = (date: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  const start =
    days === "all"
      ? "0000"
      : day(new Date(Date.now() - (Number(days) - 1) * 86400000).toISOString());
  const filtered = reports.filter((r) => !category || r.category === category);
  const opened = filtered.filter((r) => day(r.created_at) >= start);
  const counts: Record<string, number> = {};
  for (const r of opened)
    if (!["Rejected", "Resolved"].includes(r.status))
      counts[r.zone] = (counts[r.zone] ?? 0) + 1;
  const local = opened
    .filter((r) => r.zone === zone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const weeks: Record<
    string,
    { week: string; opened: number; resolved: number }
  > = {};
  const bucket = (stamp: string) => {
    const d = new Date(day(stamp) + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const week = d.toISOString().slice(0, 10);
    return weeks[week] ?? (weeks[week] = { week, opened: 0, resolved: 0 });
  };
  for (const r of local) bucket(r.created_at).opened++;
  for (const r of filtered.filter((r) => r.zone === zone))
    for (const h of r.history)
      if (h.status === "Resolved" && day(h.created_at) >= start)
        bucket(h.created_at).resolved++;
  return {
    counts,
    weeks: Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)),
    recent: local.slice((page - 1) * 20, page * 20),
    total: local.length,
  };
}

export function sampleSimulation(path: string, options: RequestInit): unknown {
  if (options.method === "DELETE") {
    setSample({
      saved: state.saved.filter((s) => s.id !== Number(path.split("/")[1])),
    });
    return undefined;
  }
  if (!options.method) return state.saved;
  const input = JSON.parse(String(options.body));
  const baseline = Number(input.baseline),
    percent = Number(input.reduction);
  if (
    !["waste", "energy", "water", "carbon"].includes(input.kind) ||
    !Number.isFinite(baseline) ||
    baseline < 0 ||
    baseline > 1e9 ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100
  )
    throw new Error("Enter a valid baseline and reduction.");
  const unit = (
    {
      waste: "kg/day",
      energy: "kWh/day",
      water: "L/day",
      carbon: "kg CO2e/day",
    } as Record<string, string>
  )[input.kind];
  const saved = Math.round(((baseline * percent) / 100) * 1e4) / 1e4;
  const result = {
    baseline,
    percent: baseline ? percent : null,
    saved,
    scenario: Math.round((baseline - saved) * 1e4) / 1e4,
    unit,
    model_version: "reduction-v1",
    assumptions: "Sample scenario. Constant baseline and reduction.",
  };
  if (input.save) {
    const id = Date.now();
    setSample({
      saved: [
        {
          id,
          title: String(input.title),
          kind: input.kind,
          zone_id: input.zone,
          result,
          created_at: new Date().toISOString(),
        },
        ...state.saved,
      ],
    });
    return { ...result, id };
  }
  return result;
}
