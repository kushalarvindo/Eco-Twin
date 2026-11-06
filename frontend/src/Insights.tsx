import { useEffect, useState } from "react";
import { api } from "./api";
import type { Saved } from "./types";
import photos from "./photo-credits.json";
import campus from "./campus-geographic.json";

const num = (value: number) =>
  value.toLocaleString("en-IN", { maximumFractionDigits: 3 });

export function useDataset<T>(
  path: string,
  revision?: unknown,
  enabled = true,
) {
  const [result, setResult] = useState<{
    path: string;
    revision: unknown;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => setResult({ path, revision, data }))
      .catch((e) => {
        if (!controller.signal.aborted)
          setResult({ path, revision, error: e.message });
      });
    return () => controller.abort();
  }, [path, revision, enabled]);
  return enabled && result?.path === path && result.revision === revision
    ? result
    : undefined;
}

export type HistoryData = {
  counts: Record<string, number>;
  weeks: { week: string; opened: number; resolved: number }[];
  recent: {
    id: number;
    title: string;
    status: string;
    category: string;
    created_at: string;
  }[];
  total: number;
};

type Datum = { label: string; values: (number | null)[] };
function Bars({
  rows,
  series,
  unit,
}: {
  rows: Datum[];
  series: string[];
  unit: string;
}) {
  const max = rows.reduce(
    (m, r) => Math.max(m, ...r.values.map((v) => v ?? 0)),
    1,
  );
  return (
    <div className="history-chart">
      <div className="chart-legend">
        {series.map((s, i) => (
          <span key={s}>
            <i className={"series-" + i} />
            {s}
          </span>
        ))}{" "}
        · {unit}
      </div>
      <div className="chart-scroll">
        <svg
          role="img"
          aria-label={
            series.join(" and ") + " by date. Exact values in the table below."
          }
          viewBox={`0 0 ${Math.max(320, rows.length * 38)} 125`}
          style={{ minWidth: Math.min(2000, rows.length * 30) }}
        >
          {rows.map((r, i) => {
            const x = (i + 0.5) * Math.max(320 / rows.length, 38);
            return (
              <g key={r.label}>
                <title>
                  {r.label} ·{" "}
                  {r.values
                    .map(
                      (v, j) =>
                        series[j] + " " + (v === null ? "missing" : num(v)),
                    )
                    .join(", ")}
                </title>
                {r.values.map((v, j) =>
                  v === null ? (
                    <text key={j} x={x} y={98} textAnchor="middle">
                      –
                    </text>
                  ) : (
                    <rect
                      key={j}
                      className={"series-" + j}
                      x={x - 9 + j * 10}
                      y={100 - (v / max) * 85}
                      width={9}
                      height={v === 0 ? 1 : (v / max) * 85}
                    />
                  ),
                )}
                {(i === 0 ||
                  i === rows.length - 1 ||
                  i % Math.max(2, Math.ceil(rows.length / 6)) === 0) && (
                  <text x={x} y={119} textAnchor="middle">
                    {r.label.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <details>
        <summary>View chart data</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {series.map((s) => (
                  <th key={s}>
                    {s} ({unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={i}>{v === null ? "Missing" : num(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function HistoryPanel({
  page,
  onPage,
  data,
  error,
  name,
}: {
  page: number;
  onPage: (page: number) => void;
  data?: HistoryData;
  error?: string;
  name: string;
}) {
  return (
    <section className="panel insight">
      <h2>{name} · report history</h2>
      {data ? (
        <>
          <p>
            {data.total} reports opened in the selected period. Resolutions are
            counted in the week they occurred.
          </p>
          <Bars
            rows={data.weeks.map((w) => ({
              label: w.week,
              values: [w.opened, w.resolved],
            }))}
            series={["Opened", "Resolved"]}
            unit="reports"
          />
          <details open={page > 1 || undefined}>
            <summary>Reports opened in this period ({data.total})</summary>
            {data.recent.length ? (
              <ul>
                {data.recent.map((r) => (
                  <li key={r.id}>
                    {r.title} · {r.category} · {r.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No matching reports.</p>
            )}
            {data.total > 20 && (
              <nav aria-label="Report history pages">
                <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
                  Previous
                </button>{" "}
                Page {page} of {Math.ceil(data.total / 20)}{" "}
                <button
                  disabled={page * 20 >= data.total}
                  onClick={() => onPage(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </details>
        </>
      ) : (
        <p role="status">{error || "Loading report history…"}</p>
      )}
    </section>
  );
}

export function Coverage() {
  const named = campus.buildings.filter((b) => b.tags.name).length;
  const levels = campus.buildings.filter(
    (b) => b.tags["building:levels"],
  ).length;
  const measured = campus.buildings.filter((b) => "height" in b.tags).length;
  const total = campus.buildings.length;
  return (
    <section className="panel insight">
      <h2>Building source coverage</h2>
      <p>
        {total} mapped footprints · OpenStreetMap extract dated{" "}
        {campus.retrieved_date}.
      </p>
      {Object.entries({
        "Name in OpenStreetMap": named,
        "Mapped floor count": levels,
        "Mapped height tag": measured,
        "Credited reference photo": campus.buildings.filter((b) =>
          photos.some((p) => p.key === b.id),
        ).length,
      }).map(([label, n]) => (
        <div key={label} className="coverage-row">
          <span>{label}</span>
          <meter aria-label={label} min={0} max={total} value={n} />
          <strong>
            {n}/{total}
          </strong>
        </div>
      ))}
      <details>
        <summary>Review sources by building</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mapped footprint</th>
                <th>Name source</th>
                <th>Height basis</th>
                <th>Reference photo</th>
              </tr>
            </thead>
            <tbody>
              {campus.buildings.map((b) => (
                <tr key={b.id}>
                  <th>
                    <a href={b.source_url}>{b.name}</a>
                  </th>
                  <td>{b.tags.name ? "OpenStreetMap" : "Project label"}</td>
                  <td>{b.height_basis}</td>
                  <td>
                    {photos.find((p) => p.key === b.id)?.year ?? "Missing"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function Compare({ saved }: { saved: Saved[] }) {
  const [ids, setIds] = useState<number[]>([]);
  const chosen = saved.filter((s) => ids.includes(s.id));
  const unit = chosen[0]?.result.unit;
  return (
    <section className="panel insight">
      <h2>Compare saved scenarios</h2>
      <p>Select up to three scenarios with the same unit.</p>
      {saved.length === 0 ? (
        <p>Save two scenarios in the studio to compare their projections.</p>
      ) : (
        <>
          <div className="compare-options">
            {saved.map((s) => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={chosen.includes(s)}
                  disabled={
                    !chosen.includes(s) &&
                    (chosen.length >= 3 || (!!unit && unit !== s.result.unit))
                  }
                  onChange={(e) =>
                    setIds(
                      e.target.checked
                        ? [...chosen.map((x) => x.id), s.id]
                        : ids.filter((id) => id !== s.id),
                    )
                  }
                />
                {s.title} ({s.result.unit})
              </label>
            ))}
          </div>
          {chosen.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Baseline ({unit})</th>
                    <th>Reduction</th>
                    <th>Daily saving ({unit})</th>
                    <th>30-day saving ({unit?.split("/")[0]})</th>
                  </tr>
                </thead>
                <tbody>
                  {chosen.map((s) => (
                    <tr key={s.id}>
                      <th>{s.title}</th>
                      <td>{num(s.result.baseline)}</td>
                      <td>
                        {s.result.percent === null
                          ? "—"
                          : num(s.result.percent) + "%"}
                      </td>
                      <td>{num(s.result.saved)}</td>
                      <td>{num(s.result.saved * 30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <small>Projected at a constant daily baseline.</small>
            </div>
          )}
        </>
      )}
    </section>
  );
}

type Electricity = {
  meters: { zone_id: string; zone__name: string; meter: string }[];
  zone?: string;
  meter?: string;
  days: { date: string; kwh: number | null; source: string | null }[];
  weeks: { week: string; covered: number; total: number }[];
};
export function MeterPanel() {
  const [query, setQuery] = useState("");
  const result = useDataset<Electricity>("analytics/electricity/" + query);
  const data = result?.data;
  const keys = data?.meters ?? [];
  return (
    <section className="panel insight">
      <h2>Electricity meter pilot</h2>
      {!data ? (
        <p role="status">{result?.error || "Loading meter records…"}</p>
      ) : keys.length === 0 ? (
        <p>
          No meter log has been imported. This panel shows daily electricity use
          and weekly totals once a building has dated kWh readings.
        </p>
      ) : (
        <>
          <label>
            Building and meter{" "}
            <select
              value={JSON.stringify([data.zone, data.meter])}
              onChange={(e) => {
                const [zone, meter] = JSON.parse(e.target.value);
                setQuery("?" + new URLSearchParams({ zone, meter }));
              }}
            >
              {keys.map((k) => (
                <option
                  key={JSON.stringify([k.zone_id, k.meter])}
                  value={JSON.stringify([k.zone_id, k.meter])}
                >
                  {k.zone__name} · {k.meter}
                </option>
              ))}
            </select>
          </label>
          <p>
            30 days ending {data.days.at(-1)?.date}. A dash marks a missing
            interval. Each date is the day ending at local midnight.
          </p>
          <Bars
            rows={data.days.map((d) => ({ label: d.date, values: [d.kwh] }))}
            series={["Electricity"]}
            unit="kWh"
          />
          <h3>Weekly comparison</h3>
          <ul>
            {data.weeks.map((w) => (
              <li key={w.week}>
                Week of {w.week} ·{" "}
                {w.covered ? num(w.total) + " kWh" : "Missing"} · {w.covered}/7
                days covered
              </li>
            ))}
          </ul>
          <p>
            Sources:{" "}
            {[...new Set(data.days.map((d) => d.source).filter(Boolean))].join(
              ", ",
            )}
          </p>
        </>
      )}
    </section>
  );
}
