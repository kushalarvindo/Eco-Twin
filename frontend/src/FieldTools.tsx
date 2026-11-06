import { useState, type FormEvent } from "react";
import { api } from "./api";
import { useDataset } from "./Insights";
import { useSample } from "./samples";
import type { Report, User, Zone } from "./types";
import data from "./campus-geographic.json";
import { footprintArea } from "./hotspots";

export function Rainwater({ selected }: { selected: string }) {
  const building = data.buildings.find((b) => b.id === selected);
  const [rain, setRain] = useState("25"),
    [efficiency, setEfficiency] = useState("80"),
    [usable, setUsable] = useState("100");
  if (!building) return null;
  const mm = Number(rain),
    eff = Number(efficiency),
    pct = Number(usable),
    area = footprintArea(building.points);
  const valid =
    rain !== "" &&
    efficiency !== "" &&
    usable !== "" &&
    [mm, eff, pct].every(Number.isFinite) &&
    mm >= 0 &&
    mm <= 3000 &&
    eff >= 0 &&
    eff <= 100 &&
    pct >= 0 &&
    pct <= 100;
  const litres = area * (pct / 100) * mm * (eff / 100);
  return (
    <section className="panel insight">
      <h2>Rainwater collection estimate</h2>
      <p>
        {building.name} · mapped roof projection ≈{" "}
        {Math.round(area).toLocaleString()} m²
      </p>
      <div className="field-grid">
        <label>
          Rainfall for the chosen event (mm)
          <input
            type="number"
            min="0"
            max="3000"
            step="any"
            value={rain}
            onChange={(e) => setRain(e.target.value)}
          />
        </label>
        <label>
          Roof connected to collection (%)
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            value={usable}
            onChange={(e) => setUsable(e.target.value)}
          />
        </label>
        <label>
          Collection efficiency (%)
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            value={efficiency}
            onChange={(e) => setEfficiency(e.target.value)}
          />
        </label>
      </div>
      <p role="status">
        {valid ? (
          <>
            <strong>{Math.round(litres).toLocaleString()} litres</strong>{" "}
            estimated for this event.
          </>
        ) : (
          "Enter rainfall from 0 to 3,000 mm and percentages from 0 to 100."
        )}
      </p>
      <p>
        Litres = area × connected roof fraction × rainfall in mm × efficiency.
        One millimetre falling on one square metre is one litre.
      </p>
      <small>
        Starts with assumed rainfall and efficiency. Verify roof drainage and
        storage capacity on site. Collection is limited by the tank space
        available.
      </small>
    </section>
  );
}
type Survey = {
  id: number;
  zone: string;
  kind: string;
  value: string;
  description: string;
  status: string;
  review_note: string;
  image: string;
};
export function Surveys({ zone, zones }: { zone: string; zones: Zone[] }) {
  const [revision, setRevision] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const session = useDataset<{ user: User | null }>("session/", revision);
  const sample = useSample(),
    result = useDataset<Survey[]>("surveys/", revision, !sample.active);
  const user = session?.data?.user;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      await api("surveys/", { method: "POST", body: new FormData(form) });
      form.reset();
      setRevision((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function review(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("surveys/" + id + "/", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      setRevision((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel insight">
      <h2>Campus survey submissions</h2>
      <p>
        Submit a building name, measured height, entrance, ramp or barrier with
        a photograph. Approved records appear below as reviewed field
        observations. A reviewer checks geometry changes before they enter the
        model.
      </p>
      {sample.active ? (
        <p>Leave sample mode to submit or review a campus observation.</p>
      ) : (
        <>
          {user ? (
            <form className="form-stack" onSubmit={submit}>
              <div className="field-grid">
                <label>
                  Survey location
                  <select name="zone" defaultValue={zone}>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Observation type
                  <select name="kind">
                    <option>Name</option>
                    <option>Height</option>
                    <option>Entrance</option>
                    <option>Ramp</option>
                    <option>Barrier</option>
                  </select>
                </label>
              </div>
              <label>
                Observed value
                <input
                  name="value"
                  required
                  maxLength={160}
                  placeholder="Height in metres, corrected name or entrance description"
                />
              </label>
              <label>
                How and when you checked it
                <textarea
                  name="description"
                  minLength={10}
                  maxLength={2000}
                  required
                  placeholder="Date, measurement method and where the photo was taken"
                />
              </label>
              <label>
                Observation photo
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg"
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                Submit for review
              </button>
            </form>
          ) : (
            <p>Sign in to submit a field observation.</p>
          )}
          <p role="status">{error || result?.error}</p>
          {!result?.data ? (
            <p>Loading survey records…</p>
          ) : result.data.length === 0 ? (
            <p>No survey submissions available.</p>
          ) : (
            <>
              <p>Latest {result.data.length} records visible to you.</p>
              {result.data.map((s) => (
                <article className="survey-record" key={s.id}>
                  <h3>
                    {zones.find((z) => z.id === s.zone)?.name ?? s.zone} ·{" "}
                    {s.kind}
                  </h3>
                  <p>
                    {s.value} · {s.status}
                  </p>
                  <p>{s.description}</p>
                  <details>
                    <summary>View observation photo</summary>
                    <img
                      className="field-photo"
                      src={s.image}
                      alt={"Survey observation of " + s.kind}
                      loading="lazy"
                    />
                  </details>
                  {s.review_note && <p>Review note · {s.review_note}</p>}
                  {user?.moderator && s.status === "Pending" && (
                    <form
                      className="form-stack"
                      onSubmit={(e) => review(e, s.id)}
                    >
                      <label>
                        Decision
                        <select name="status">
                          <option>Approved</option>
                          <option>Rejected</option>
                        </select>
                      </label>
                      <label>
                        Review note
                        <input
                          name="note"
                          required
                          minLength={3}
                          maxLength={500}
                        />
                      </label>
                      <button className="button secondary" disabled={busy}>
                        Record decision
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
export function RepairEvidence({
  report: r,
  onDone,
}: {
  report: Report;
  onDone: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("reports/" + r.id + "/confirmation/", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      setMessage("Confirmation recorded.");
      await onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="repair-evidence">
      <h3>Repair evidence</h3>
      {r.repair_image ? (
        <img
          className="field-photo"
          src={r.repair_image}
          alt={"After repair of " + r.title}
        />
      ) : (
        <p>
          {r.sample
            ? "Sample workflow; images are illustrations."
            : "No repair photograph has been uploaded yet."}
        </p>
      )}
      {r.confirmation && <p>Reporter response · {r.confirmation}</p>}
      {r.mine && r.status === "Resolved" && !r.sample && (
        <form onSubmit={confirm} className="form-stack">
          <label>
            Has the issue been fixed?
            <select name="confirmation">
              <option value="Confirmed">Yes, fixed</option>
              <option value="Needs follow-up">Needs follow-up</option>
            </select>
          </label>
          <label>
            What you observed
            <input name="note" required minLength={3} maxLength={500} />
          </label>
          <button className="button secondary" disabled={busy}>
            Send confirmation
          </button>
        </form>
      )}
      <p role="status">{error || message}</p>
    </section>
  );
}
