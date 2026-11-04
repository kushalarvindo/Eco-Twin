import { useSyncExternalStore } from "react";
export type Preferences = {
  theme: "system" | "light" | "dark";
  accent: "forest" | "ocean" | "clay";
  density: "comfortable" | "compact";
  text: "standard" | "large";
  quality: "balanced" | "low";
  view: "3d" | "2d";
  motion: boolean;
};
export const defaults: Preferences = {
  theme: "system",
  accent: "forest",
  density: "comfortable",
  text: "standard",
  quality: "balanced",
  view: "3d",
  motion: false,
};
const key = "ecotwin.preferences.v1";
let prefs: Preferences = { ...defaults };
try {
  const stored = JSON.parse(localStorage.getItem(key) || "{}");
  for (const k of [
    "theme",
    "accent",
    "density",
    "text",
    "quality",
    "view",
  ] as const) {
    const allowed = {
      theme: ["system", "light", "dark"],
      accent: ["forest", "ocean", "clay"],
      density: ["comfortable", "compact"],
      text: ["standard", "large"],
      quality: ["balanced", "low"],
      view: ["3d", "2d"],
    };
    if (allowed[k].includes(stored[k]))
      Object.assign(prefs, { [k]: stored[k] });
  }
  prefs.motion = stored.motion === true;
} catch {}
const media = matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();
function apply() {
  const root = document.documentElement;
  root.dataset.theme =
    prefs.theme === "system" ? (media.matches ? "dark" : "light") : prefs.theme;
  for (const k of ["accent", "density", "text", "quality"] as const)
    root.dataset[k] = prefs[k];
  root.dataset.reducedMotion = String(prefs.motion);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      root.dataset.theme === "dark" ? "#111b16" : "#f4f7f2",
    );
}
apply();
media.addEventListener("change", () => {
  prefs = { ...prefs };
  apply();
  listeners.forEach((fn) => fn());
});
export function updatePreferences(next: Partial<Preferences>) {
  prefs = { ...prefs, ...next };
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {}
  apply();
  listeners.forEach((fn) => fn());
}
export function usePreferences() {
  const p = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => prefs,
  );
  return {
    ...p,
    dark: p.theme === "dark" || (p.theme === "system" && media.matches),
  };
}
