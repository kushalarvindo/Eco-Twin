import { sampleState, sampleSimulation } from "./samples";
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (sampleState().active && path.startsWith("simulations/"))
    return sampleSimulation(path, options) as T;
  if (sampleState().active && options.method && options.method !== "GET")
    throw new Error("Return to campus records to submit this change.");
  const csrf =
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")[1] || "";
  const headers = new Headers(options.headers);
  headers.set("X-CSRFToken", decodeURIComponent(csrf));
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (!res.ok) {
    let message = "The request could not be completed. Please try again.";
    try {
      const data = await res.json();
      message =
        typeof data === "string"
          ? data
          : Array.isArray(data)
            ? data.join(" ")
            : data.detail || Object.values(data).flat().join(" ");
    } catch {}
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
export const json = (data: unknown) => JSON.stringify(data);
export const date = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const num = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
