import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type { MapPoint, Proposal, ProposalObject } from "./studio-math";
import {
  inside,
  mapCoordinates,
  pathDistance,
  polygonArea,
  sunPosition,
  validProposal,
  walkStart,
} from "./studio-math";
import campus from "./campus-geographic.json";
import photos from "./photo-credits.json";

export type StudioMode =
  | "explore"
  | "walk"
  | "edit"
  | "sun"
  | "pin"
  | "measure"
  | "cutaway"
  | "panorama";
type Panorama = {
  id: string;
  name: string;
  zone: string;
  url: string;
  links: { target: string; yaw: number; pitch: number }[];
};
function useStudioState() {
  const [mode, setMode] = useState<StudioMode>("explore"),
    [date, setDate] = useState(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    ),
    [hour, setHour] = useState(12);
  const [objects, setObjects] = useState<ProposalObject[]>([]),
    [kind, setKind] = useState<ProposalObject["kind"]>("tree"),
    [chosen, setChosen] = useState(""),
    [name, setName] = useState("Campus proposal"),
    [saved, setSaved] = useState<Proposal[]>(() => {
      try {
        return JSON.parse(localStorage.getItem("ecotwin.proposals.v1") ?? "[]")
          .filter(validProposal)
          .slice(0, 20);
      } catch {
        return [];
      }
    });
  const [split, setSplit] = useState(50),
    [compare, setCompare] = useState(true),
    [points, setPoints] = useState<MapPoint[]>([]),
    [areaMode, setAreaMode] = useState(false),
    [floor, setFloor] = useState(1),
    [notice, setNotice] = useState("");
  const [position, setPosition] = useState<MapPoint>(walkStart("cse")),
    [yaw, setYaw] = useState(0);
  const keys = useRef(new Set<string>());
  const [panoramas, setPanoramas] = useState<Panorama[]>([]),
    [panorama, setPanorama] = useState(""),
    [panoFov, setPanoFov] = useState(75);
  const look = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => {
    try {
      localStorage.setItem("ecotwin.proposals.v1", JSON.stringify(saved));
    } catch {
      setNotice("Storage is full. Export the proposal to keep a copy.");
    }
  }, [saved]);
  const panoUrls = useRef<string[]>([]);
  useEffect(
    () => () => panoUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  return {
    mode,
    setMode,
    date,
    setDate,
    hour,
    setHour,
    objects,
    setObjects,
    kind,
    setKind,
    chosen,
    setChosen,
    name,
    setName,
    saved,
    setSaved,
    split,
    setSplit,
    compare,
    setCompare,
    points,
    setPoints,
    areaMode,
    setAreaMode,
    floor,
    setFloor,
    notice,
    setNotice,
    position,
    setPosition,
    yaw,
    setYaw,
    keys,
    panoramas,
    setPanoramas,
    panorama,
    setPanorama,
    panoFov,
    setPanoFov,
    look,
    panoUrls,
  };
}
type StudioState = ReturnType<typeof useStudioState>;
const Context = createContext<StudioState | null>(null);
export const useStudio = () => useContext(Context);
export function StudioProvider({ children }: { children: ReactNode }) {
  const state = useStudioState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function StudioToolbar({
  selected,
  activate,
  onPin,
}: {
  selected: string;
  activate: () => void;
  onPin: (point: MapPoint) => void;
}) {
  const s = useStudio()!;
  const building = campus.buildings.find((b) => b.id === selected);
  useEffect(() => s.setFloor(1), [selected]);
  const activeObject = s.objects.find((o) => o.id === s.chosen);
  const currentMode = useRef(s.mode);
  useEffect(() => {
    currentMode.current = s.mode;
  }, [s.mode]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [importError, setImportError] = useState("");
  async function panoramaUpload(file: File | undefined) {
    if (!file) return;
    if (s.panoramas.length >= 8) {
      s.setNotice("Load up to eight panoramas per tab.");
      return;
    }
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      s.setNotice("Choose a JPEG or PNG panorama up to 20 MB.");
      return;
    }
    const url = URL.createObjectURL(file),
      image = new Image();
    image.onload = () => {
      if (!mounted.current || currentMode.current !== "panorama") {
        URL.revokeObjectURL(url);
        return;
      }
      if (
        Math.abs(image.width / image.height - 2) > 0.1 ||
        image.width * image.height > 64e6
      ) {
        URL.revokeObjectURL(url);
        s.setNotice(
          "Choose an equirectangular panorama with a 2:1 aspect ratio and at most 64 megapixels.",
        );
        return;
      }
      let viewerUrl = url;
      if (image.width > 4096) {
        const canvas = document.createElement("canvas");
        canvas.width = 4096;
        canvas.height = 2048;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(image, 0, 0, 4096, 2048);
          viewerUrl = canvas.toDataURL("image/jpeg", 0.88);
          URL.revokeObjectURL(url);
        }
      }
      if (viewerUrl.startsWith("blob:")) s.panoUrls.current.push(viewerUrl);
      const id = crypto.randomUUID();
      s.setPanoramas((p) => [
        ...p,
        { id, name: file.name, zone: selected, url: viewerUrl, links: [] },
      ]);
      s.setPanorama(id);
      s.setMode("panorama");
      activate();
      s.setNotice(
        "Local panorama loaded. It stays in this tab until you reload.",
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      s.setNotice("This image could not be read.");
    };
    image.src = url;
  }
  function save() {
    if (!s.name.trim()) {
      s.setNotice("Name the proposal first.");
      return;
    }
    const proposal = {
      id: crypto.randomUUID(),
      name: s.name.trim().slice(0, 100),
      objects: s.objects,
    };
    if (!validProposal(proposal)) {
      s.setNotice(
        "Keep every object inside the mapped campus and use a valid position.",
      );
      return;
    }
    s.setSaved((items) => [proposal, ...items].slice(0, 20));
    s.setNotice("Proposal saved on this device.");
  }
  function download() {
    if (!validProposal({ id: "export", name: s.name, objects: s.objects })) {
      s.setNotice(
        "Keep the proposal name and positions valid before exporting.",
      );
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          { id: crypto.randomUUID(), name: s.name, objects: s.objects },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "campus-proposal.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 100000)
        throw new Error("Use a proposal file smaller than 100 KB.");
      const data = JSON.parse(await file.text());
      if (!validProposal(data))
        throw new Error("This proposal contains invalid objects or positions.");
      s.setObjects(data.objects);
      s.setName(data.name);
      setImportError("");
    } catch (e) {
      setImportError((e as Error).message);
    }
  }
  const location = mapCoordinates([
    building?.centroid[0] ?? 0,
    0,
    building?.centroid[1] ?? 0,
  ]);
  return (
    <section className="studio-tools" aria-label="3D tools">
      <label>
        3D tools{" "}
        <select
          value={s.mode}
          aria-label="3D tool"
          onChange={(e) => {
            s.setMode(e.target.value as StudioMode);
            if (["pin", "measure"].includes(e.target.value)) s.setPoints([]);
            activate();
            s.setNotice("");
            s.keys.current.clear();
            if (e.target.value === "walk") {
              s.setPosition(walkStart(selected));
              s.setYaw(0);
            }
          }}
        >
          <option value="explore">Campus overview</option>
          <option value="walk">Walk at ground level</option>
          <option value="edit">Before and after editor</option>
          <option value="sun">Sun and shade</option>
          <option value="pin">Place a report pin</option>
          <option value="measure">Measure distance or area</option>
          <option value="cutaway">Building cutaway</option>
          <option value="panorama">360° viewpoints</option>
        </select>
      </label>
      {s.mode === "walk" && (
        <>
          <p>WASD to move. Drag to look. Esc to exit.</p>
          <div className="walk-buttons" aria-label="Walking controls">
            {[
              ["w", "Forward"],
              ["s", "Back"],
              ["a", "Left"],
              ["d", "Right"],
              ["ArrowLeft", "Turn left"],
              ["ArrowRight", "Turn right"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-label={label}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  s.keys.current.add(key);
                  window.dispatchEvent(new Event("campus-walk-input"));
                }}
                onPointerUp={() => s.keys.current.delete(key)}
                onPointerCancel={() => s.keys.current.clear()}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {s.mode === "edit" && (
        <>
          <p>Choose an object, then click the map to place it.</p>
          <div className="field-grid">
            <label>
              Object
              <select
                value={s.kind}
                onChange={(e) =>
                  s.setKind(e.target.value as ProposalObject["kind"])
                }
              >
                <option value="tree">Tree</option>
                <option value="bin">Waste bin</option>
                <option value="solar">Solar panel array</option>
                <option value="tank">Rainwater tank</option>
              </select>
            </label>
            <label>
              Proposal name
              <input
                value={s.name}
                maxLength={100}
                onChange={(e) => s.setName(e.target.value)}
              />
            </label>
          </div>
          <label className="preference-check">
            <input
              type="checkbox"
              checked={s.compare}
              onChange={(e) => s.setCompare(e.target.checked)}
            />
            Compare existing and proposed
          </label>
          {s.compare && (
            <label>
              Comparison divider · existing on the left
              <input
                type="range"
                min="0"
                max="100"
                value={s.split}
                onChange={(e) => s.setSplit(Number(e.target.value))}
              />
            </label>
          )}
          <div className="studio-actions">
            <button onClick={save}>Save proposal</button>
            <button onClick={download}>Export proposal</button>
          </div>
          <details className="studio-advanced">
            <summary>Saved proposals and object controls</summary>
            <label>
              Import proposal
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            {importError && <p role="alert">{importError}</p>}
            <label>
              Saved proposal
              <select
                value=""
                onChange={(e) => {
                  const p = s.saved.find((p) => p.id === e.target.value);
                  if (p) {
                    s.setObjects(structuredClone(p.objects));
                    s.setName(p.name);
                  }
                }}
              >
                <option value="">Choose a saved proposal</option>
                {s.saved.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Placed object
              <select
                value={s.chosen}
                onChange={(e) => s.setChosen(e.target.value)}
              >
                <option value="">Choose an object to move</option>
                {s.objects.map((o, i) => (
                  <option key={o.id} value={o.id}>
                    {i + 1}. {o.kind}
                  </option>
                ))}
              </select>
            </label>
            {activeObject && (
              <>
                <div className="field-grid">
                  {[0, 2].map((axis) => (
                    <label key={axis}>
                      {axis === 0 ? "East position" : "South position"} (m)
                      <input
                        type="number"
                        step=".5"
                        value={Math.round(activeObject.point[axis] * 60) / 10}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n))
                            s.setObjects((items) =>
                              items.map((o) =>
                                o.id === s.chosen
                                  ? {
                                      ...o,
                                      point: o.point.map((v, i) =>
                                        i === axis ? n / 6 : v,
                                      ) as MapPoint,
                                    }
                                  : o,
                              ),
                            );
                        }}
                      />
                    </label>
                  ))}
                  <label>
                    Rotation (degrees)
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={activeObject.rotation}
                      onChange={(e) =>
                        s.setObjects((items) =>
                          items.map((o) =>
                            o.id === s.chosen
                              ? { ...o, rotation: Number(e.target.value) }
                              : o,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <button
                  onClick={() =>
                    s.setObjects((items) =>
                      items.filter((o) => o.id !== s.chosen),
                    )
                  }
                >
                  Remove selected object
                </button>
              </>
            )}
          </details>
          <details>
            <summary>Proposal details</summary>
            <p>
              Save up to 40 objects. These are proposals; roof suitability, tree
              growth, and savings need a site assessment.
            </p>
          </details>
        </>
      )}
      {s.mode === "sun" && (
        <>
          <div className="field-grid">
            <label>
              Campus date
              <input
                type="date"
                value={s.date}
                min="2000-01-01"
                max="2100-12-31"
                onChange={(e) => {
                  if (e.target.value) s.setDate(e.target.value);
                }}
              />
            </label>
            <label>
              Time in Bengaluru · {String(Math.floor(s.hour)).padStart(2, "0")}:
              {s.hour % 1 ? "30" : "00"}
              <input
                type="range"
                min="0"
                max="23.5"
                step=".5"
                value={s.hour}
                onChange={(e) => s.setHour(Number(e.target.value))}
              />
            </label>
          </div>
          <p>
            Sun altitude {sunPosition(s.date, s.hour).altitude.toFixed(1)}° ·
            Estimated shadows
          </p>
          <details>
            <summary>How shadows are estimated</summary>
            <p>
              Sun position uses the selected date and Bengaluru time. Shadows
              use estimated building heights and exclude weather and tree
              canopy.
            </p>
          </details>
        </>
      )}
      {s.mode === "pin" && (
        <>
          <p>Click the map to place a pin.</p>
          {s.points[0] && (
            <>
              <p>Pin selected near {building?.name ?? "the selected zone"}.</p>
              <button onClick={() => onPin(s.points[0])}>
                Report issue at this pin
              </button>
              <button onClick={() => s.setPoints([])}>Clear pin</button>
            </>
          )}
        </>
      )}
      {s.mode === "measure" && (
        <>
          <p>Click map points to measure. Values are approximate.</p>
          <label>
            Measurement
            <select
              value={s.areaMode ? "area" : "distance"}
              onChange={(e) => {
                s.setAreaMode(e.target.value === "area");
                s.setPoints([]);
              }}
            >
              <option value="distance">Distance along points</option>
              <option value="area">Horizontal area</option>
            </select>
          </label>
          <p role="status">
            {s.points.length} points ·{" "}
            {s.areaMode
              ? polygonArea(s.points).toFixed(1) + " m²"
              : pathDistance(s.points).toFixed(1) + " m"}
          </p>
          <button onClick={() => s.setPoints((p) => p.slice(0, -1))}>
            Undo point
          </button>
          <button onClick={() => s.setPoints([])}>Clear measurement</button>
        </>
      )}
      {s.mode === "cutaway" && building && (
        <>
          <label>
            Visible floor level
            <input
              type="range"
              min="1"
              max={Math.max(1, Math.ceil((building.height_m - 0.01) / 3.2))}
              value={Math.min(
                s.floor,
                Math.max(1, Math.ceil((building.height_m - 0.01) / 3.2)),
              )}
              onChange={(e) => s.setFloor(Number(e.target.value))}
            />
          </label>
          <p>
            Level {s.floor} · {building.name} · Estimated floors
          </p>
          <details>
            <summary>Floor details</summary>
            <p>
              Floors use an assumed 3.2 m spacing. Verified plans are needed for
              rooms and stairs.
            </p>
            <a
              href="https://naac.rvce.edu.in/sites/default/files/2024-05/4-1-1-infrastructure-yoga-newconstructions.pdf"
              target="_blank"
              rel="noreferrer"
            >
              RVCE infrastructure reference
            </a>
          </details>
        </>
      )}
      {s.mode === "panorama" && (
        <>
          <p>Open Street View or load a 2:1 panorama.</p>
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Street View near {building?.name ?? "RVCE"}
          </a>
          <label>
            Load a local panorama
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => panoramaUpload(e.target.files?.[0])}
            />
          </label>
          {s.panoramas.length > 0 && (
            <>
              <label>
                Viewpoint
                <select
                  value={s.panorama}
                  onChange={(e) => s.setPanorama(e.target.value)}
                >
                  {s.panoramas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Field of view
                <input
                  type="range"
                  min="35"
                  max="95"
                  value={s.panoFov}
                  onChange={(e) => s.setPanoFov(Number(e.target.value))}
                />
              </label>
              {s.panoramas.length > 1 && (
                <label>
                  Add a hotspot in the direction you are looking
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        s.setPanoramas((ps) =>
                          ps.map((p) =>
                            p.id === s.panorama
                              ? {
                                  ...p,
                                  links: [
                                    ...p.links,
                                    {
                                      target: e.target.value,
                                      ...s.look.current,
                                    },
                                  ],
                                }
                              : p,
                          ),
                        );
                    }}
                  >
                    <option value="">Link to another viewpoint</option>
                    {s.panoramas
                      .filter((p) => p.id !== s.panorama)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          )}
          <small>
            Local images stay on your device. Street View availability varies.
          </small>
        </>
      )}
      {s.notice && <p role="status">{s.notice}</p>}
    </section>
  );
}

export function CampusPhotos({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const records = photos.map((p) => ({
    ...p,
    src: "src" in p ? String(p.src) : "/campus/admin.jpg",
    zone: p.key === "sir-m-v-hostel" ? "osm-133117221" : p.key,
  }));
  const [chosen, setChosen] = useState("");
  useEffect(() => setChosen(""), [selected]);
  const current =
    records.find((p) => p.key === (chosen || selected)) ??
    records.find((p) => p.zone === selected);
  const matching = records.filter((p) => p.zone === selected);
  return (
    <section className="panel insight campus-photos">
      <h2>Campus photos</h2>
      <div className="photo-thumbs">
        {records.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setChosen(p.key);
              if (campus.buildings.some((b) => b.id === p.zone))
                onSelect(p.zone);
            }}
            aria-pressed={current?.key === p.key}
          >
            <img
              src={p.src}
              alt={
                p.key === "admin"
                  ? "RVCE Administrative Block"
                  : p.key === "mechanical"
                    ? "RVCE campus near Mechanical Engineering"
                    : "RVCE Sir M V Hostel"
              }
            />
            <span>
              {p.key === "admin"
                ? "Administrative Block"
                : p.key === "mechanical"
                  ? "Near Mechanical Engineering"
                  : "Sir M V Hostel"}{" "}
              · {p.year}
            </span>
          </button>
        ))}
      </div>
      {current && (
        <figure>
          <img
            className="campus-reference"
            src={current.src}
            alt={
              current.key === "admin"
                ? "RVCE Administrative Block in 2009"
                : current.key === "mechanical"
                  ? "Campus near the Mechanical Engineering block in 2009"
                  : "Sir M V Hostel in 2012"
            }
          />
          <figcaption>
            {current.key === "admin"
              ? "Administrative Block"
              : current.key === "mechanical"
                ? "Campus near Mechanical Engineering"
                : "Sir M V Hostel"}{" "}
            ·
            <a href={current.source_url} target="_blank" rel="noreferrer">
              {current.author}, {current.year}
            </a>{" "}
            ·{" "}
            <a href={current.license_url} target="_blank" rel="noreferrer">
              {current.license}
            </a>
            . {current.changes}
          </figcaption>
        </figure>
      )}
      {!matching.length && <p>No matching photo for this building yet.</p>}
      {["cse", "library"].includes(selected) && (
        <p>
          <a
            href="https://rvceupdates.wordpress.com/photos/"
            target="_blank"
            rel="noreferrer"
          >
            CSE and library photos: RVCE Updates album
          </a>
          . Dates unconfirmed.
        </p>
      )}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((campus.buildings.find((b) => b.id === selected)?.name ?? "RV College of Engineering") + " RVCE Bengaluru")}`}
        target="_blank"
        rel="noreferrer"
      >
        More photos on Google Maps
      </a>
    </section>
  );
}

export function WalkMiniMap({
  route,
}: {
  route?: { points: number[][] } | null;
}) {
  const s = useStudio();
  if (s?.mode !== "walk") return null;
  return (
    <div className="walk-minimap">
      <svg
        viewBox="-65 -55 130 110"
        role="img"
        aria-label="Your position on the campus map"
      >
        <polygon
          points={campus.boundary.map((p) => p.join(",")).join(" ")}
          fill="#d5dfc4"
        />
        {campus.buildings.map((b) => (
          <polygon
            key={b.id}
            points={b.points.map((p) => p.join(",")).join(" ")}
            fill="#68806c"
          />
        ))}
        {route && (
          <polyline
            points={route.points
              .map((p) => [p[0], p[2] ?? p[1]].join(","))
              .join(" ")}
            stroke="#1d6288"
            strokeWidth="1"
            fill="none"
          />
        )}
        <line
          x1={s.position[0]}
          y1={s.position[2]}
          x2={s.position[0] - Math.sin(s.yaw) * 5}
          y2={s.position[2] - Math.cos(s.yaw) * 5}
          stroke="#a32b2b"
          strokeWidth="1.3"
        />
        <circle
          cx={s.position[0]}
          cy={s.position[2]}
          r="1.7"
          fill="#bb3030"
          stroke="white"
          strokeWidth=".5"
        />
      </svg>
      <small>Position in the model</small>
    </div>
  );
}
