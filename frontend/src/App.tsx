import {
  StudioProvider,
  StudioToolbar,
  CampusPhotos,
  useStudio,
  WalkMiniMap,
} from "./CampusStudio";
import { mapCoordinates, type MapPoint } from "./studio-math";
import { Rainwater, Surveys, RepairEvidence } from "./FieldTools";
import {
  useSample,
  sampleUser,
  sampleHistory,
  addSampleReport,
  updateSampleReport,
  sampleState,
  setSample,
} from "./samples";
import {
  HistoryPanel,
  Coverage,
  Compare,
  MeterPanel,
  useDataset,
  type HistoryData,
} from "./Insights";
import "./hotspots.css";
import {
  hotspotLayer,
  hotspotModes,
  footprintArea,
  type Hotspots,
} from "./hotspots";
import PreferencesPanel from "./WorkspaceSettings";
import { usePreferences } from "./preferences";
import { DebugMode } from "./DebugMode";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  NavLink,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  Bike,
  BookOpen,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  FlaskConical,
  Flame,
  Grid2X2,
  Heart,
  Info,
  Layers,
  Leaf,
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Navigation,
  Plus,
  Recycle,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Target,
  TreePine,
  Trophy,
  Upload,
  Users,
  Waves as WaterWaves,
  X,
  Zap,
} from "lucide-react";
import { api, date, json, num } from "./api";
import type {
  Challenge,
  Fact,
  Post,
  Report,
  Result,
  Review,
  Saved,
  User,
  Zone,
} from "./types";
import {
  campusViewpoints,
  campusInfrastructure,
  buildingDirectory,
  calculateWalkRoute,
  getOfflineReports,
  saveOfflineReport,
  removeOfflineReport,
  type InfrastructureAsset,
  type OfflineReport,
} from "./campus-features";
const Campus = lazy(() => import("./Campus"));
const GeographicScene = lazy(() => import("./GeographicScene"));
import geographic from "./campus-geographic.json";
import layout from "./campus-layout.json";
import photoData from "./photo-credits.json";
const photos = photoData;
const Comparison = lazy(() => import("./Comparison"));
const navigation = [
  { to: "/", label: "Campus explorer", icon: Compass },
  { to: "/reports", label: "Issue reports", icon: MapPin },
  { to: "/dashboard", label: "Environment", icon: Grid2X2 },
  { to: "/simulations", label: "What-if studio", icon: FlaskConical },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/community", label: "Community", icon: Users },
];
const categoryIcon = (cat: string) => {
  const c = (cat || "").toLowerCase();
  if (c.includes("energy")) return Zap;
  if (c.includes("water")) return WaterWaves;
  if (c.includes("green") || c.includes("tree")) return TreePine;
  if (
    c.includes("transport") ||
    c.includes("transit") ||
    c.includes("parking") ||
    c.includes("bike")
  )
    return Bike;
  if (c.includes("carbon")) return Leaf;
  if (c.includes("waste") || c.includes("recycle")) return Recycle;
  return Sparkles;
};
const statusClass = (s: string) =>
  s === "Resolved" || s === "Approved"
    ? "success"
    : s === "Rejected"
      ? "danger"
      : s === "Pending"
        ? "warning"
        : "neutral";
function Empty({
  icon: Icon = Sprout,
  title,
  children,
}: {
  icon?: typeof Sprout;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" size={22} /> Loading…
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? "wide" : ""}`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="modal-head">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close
              className="modal-close-button"
              aria-label="Close dialog"
            >
              <X size={18} strokeWidth={2.2} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const sample = useSample();
  const [serverUser, setUser] = useState<User | null>(null),
    [zones, setZones] = useState<Zone[]>([]),
    [facts, setFacts] = useState<Fact[]>([]),
    [serverReports, setReports] = useState<Report[]>([]),
    [challenges, setChallenges] = useState<Challenge[]>([]),
    [posts, setPosts] = useState<Post[]>([]),
    [serverSaved, setSaved] = useState<Saved[]>([]),
    [reviews, setReviews] = useState<Review[]>([]);
  const user = sample.active ? sampleUser() : serverUser;
  const reports = sample.active ? sample.reports : serverReports;
  const saved = sample.active ? sample.saved : serverSaved;
  const [ready, setReady] = useState(false),
    [bootError, setBootError] = useState(""),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(""),
    [activeReport, setActiveReport] = useState<Report | null>(null),
    [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null),
    [activeReview, setActiveReview] = useState<Review | null>(null),
    [mobileMenu, setMobileMenu] = useState(false);
  const [mapPin, setMapPin] = useState<MapPoint | null>(null);
  const [prefillReport, setPrefillReport] = useState<{
    title: string;
    category: string;
    description: string;
    zone: string;
  } | null>(null);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selected = params.get("zone") || "cse";
  const zone = zones.find((z) => z.id === selected) || zones[0];
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const refresh = useCallback(async () => {
    try {
      const s = await api<{ user: User | null }>("session/");
      setUser(s.user);
      const [rr, cc, pp] = await Promise.all([
        api<Report[]>("reports/"),
        api<Challenge[]>("challenges/"),
        api<Post[]>("posts/"),
      ]);
      setReports(rr);
      setChallenges(cc);
      setPosts(pp);
      if (s.user) {
        if (!sampleState().active) setSaved(await api<Saved[]>("simulations/"));
        if (s.user.moderator) setReviews(await api<Review[]>("reviews/"));
        else setReviews([]);
      } else {
        setSaved([]);
        setReviews([]);
      }
    } catch (e) {
      throw e;
    }
  }, []);
  const load = useCallback(async () => {
    setBootError("");
    try {
      const b = await api<{ zones: Zone[]; facts: Fact[] }>("bootstrap/");
      setZones(b.zones);
      setFacts(b.facts);
      await refresh();
      setReady(true);
    } catch (e) {
      setBootError((e as Error).message);
    }
  }, [refresh]);
  useEffect(() => {
    load();
  }, [load]);
  const selectZone = (id: string) =>
    setParams((p) => {
      p.set("zone", id);
      return p;
    });
  function needUser(action: () => void) {
    if (!user) {
      setModal("auth");
      return;
    }
    action();
  }
  const close = () => {
    setModal("");
    setActiveReport(null);
    setActiveChallenge(null);
    setActiveReview(null);
  };
  async function signOut() {
    if (sample.active) {
      setSample({ active: false });
      return;
    }
    try {
      await api("auth/logout/", { method: "POST", body: json({}) });
      await refresh();
      notify("You have signed out.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  const reportAction = () => needUser(() => setModal("report"));
  const openReport = (r: Report) => {
    setActiveReport(r);
    setModal("detail");
  };
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        id="campus-navigation"
        className={`sidebar ${mobileMenu ? "is-open" : ""}`}
      >
        <NavLink to="/" className="brand" onClick={() => setMobileMenu(false)}>
          <span className="brand-mark">
            <Leaf size={24} />
          </span>
          <span>
            eco<span className="brand-light">twin</span>
            <span className="brand-dot">.</span>
            <small>RVCE campus map</small>
          </span>
        </NavLink>
        <div className="workspace-label">Your workspace</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileMenu(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {to === "/reports" && reports.length > 0 && (
                <span className="nav-count">{reports.length}</span>
              )}
            </NavLink>
          ))}
          {user?.moderator && (
            <NavLink to="/moderation" onClick={() => setMobileMenu(false)}>
              <ShieldCheck size={19} /> Moderation{" "}
              <span className="nav-count">
                {reports.filter((r) => r.status === "Pending").length +
                  reviews.length}
              </span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="grow-card">
            <span className="grow-symbol">
              <Sprout size={28} />
            </span>
            <h3>Campus challenges</h3>

            <NavLink to="/challenges">
              Find a challenge <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <button className="source-link" onClick={() => setModal("sources")}>
            <BookOpen size={18} /> About the data <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-foot">
            <span className="tiny-dot" /> RVCE campus pilot <span>v1.0</span>
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileMenu}
              aria-controls="campus-navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={22} />
            </button>
            <span className="campus-symbol">
              <MapPin size={17} />
            </span>
            <span>
              RV College of Engineering <small>Bengaluru campus</small>
            </span>
            <span className="pilot-pill">Pilot workspace</span>
          </div>
          <div className="topbar-right">
            <PreferencesPanel />
            <button
              className="icon-button notifications"
              aria-label="View your activity"
              onClick={() => needUser(() => navigate("/profile"))}
            >
              <Bell size={20} />
              {user && user.rewards.length > 0 && <i />}
            </button>
            <span className="topbar-divider" />
            {user ? (
              <button
                className="user-menu"
                onClick={() => navigate("/profile")}
              >
                <span className="avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  {user.name}
                  <small>
                    {user.moderator ? "Moderator" : `${user.points} eco-points`}
                  </small>
                </span>
                <ChevronDown size={15} />
              </button>
            ) : (
              <button className="button small" onClick={() => setModal("auth")}>
                <LogIn size={16} /> Sign in
              </button>
            )}
          </div>
        </header>
        <main id="main">
          {sample.active && (
            <div className="sample-label" role="status">
              <strong>Sample data</strong> · Browser-only examples{" "}
              <button
                className="text-button"
                onClick={() => setSample({ active: false })}
              >
                Return to campus records
              </button>
            </div>
          )}

          {bootError ? (
            <div className="error-state">
              <Info />
              <h1>The workspace couldn’t connect.</h1>
              <p>
                Start the Django API, then try again. Your saved work stays in
                the database.
              </p>
              <p className="form-error">{bootError}</p>
              <button className="button" onClick={load}>
                Try again
              </button>
            </div>
          ) : !ready ? (
            <Loading />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <Explorer
                    factCount={facts.length}
                    zones={zones}
                    zone={zone}
                    selected={selected}
                    onSelect={selectZone}
                    reports={reports}
                    onReport={reportAction}
                    onSources={() => setModal("sources")}
                    onDetail={openReport}

                    onPin={(point) => {
                      setMapPin(point);
                      const nearest = [...geographic.buildings].sort(
                        (a, b) =>
                          Math.hypot(
                            a.centroid[0] - point[0],
                            a.centroid[1] - point[2],
                          ) -
                          Math.hypot(
                            b.centroid[0] - point[0],
                            b.centroid[1] - point[2],
                          ),
                      )[0];
                      selectZone(nearest.id);
                      reportAction();
                    }}
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <ReportsPage
                    reports={reports}
                    user={user}
                    onCreate={reportAction}
                    onDetail={openReport}
                    onRefresh={refresh}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    facts={facts}
                    reports={reports}
                    onSources={() => setModal("sources")}
                  />
                }
              />
              <Route
                path="/simulations"
                element={
                  <SimulationPage
                    zones={zones}
                    user={user}
                    saved={saved}
                    onAuth={() => setModal("auth")}
                    refresh={refresh}
                    notify={notify}
                  />
                }
              />
              <Route
                path="/challenges"
                element={
                  <ChallengesPage
                    challenges={challenges}
                    onJoin={async (c) => {
                      needUser(async () => {
                        try {
                          await api(`challenges/${c.id}/join/`, {
                            method: "POST",
                            body: json({}),
                          });
                          await refresh();
                          notify(
                            "You’re in! Open the challenge to submit your evidence.",
                          );
                        } catch (e) {
                          notify((e as Error).message);
                        }
                      });
                    }}
                    onEvidence={(c) =>
                      needUser(() => {
                        setActiveChallenge(c);
                        setModal("evidence");
                      })
                    }
                  />
                }
              />
              <Route
                path="/community"
                element={
                  <CommunityPage
                    posts={posts}
                    zones={zones}
                    user={user}
                    onAuth={() => setModal("auth")}
                    refresh={refresh}
                    notify={notify}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <Profile
                    user={user}
                    onAuth={() => setModal("auth")}
                    onSignOut={signOut}
                    reports={reports}
                    onDetail={openReport}
                    saved={saved}
                  />
                }
              />
              <Route
                path="/moderation"
                element={
                  user?.moderator ? (
                    <Moderation
                      reports={reports}
                      reviews={reviews}
                      onDetail={openReport}
                      onReview={(r) => {
                        setActiveReview(r);
                        setModal("review");
                      }}
                    />
                  ) : (
                    <Empty icon={ShieldCheck} title="Moderator access required">
                      Sign in with an authorised moderator account to review
                      contributions.
                    </Empty>
                  )
                }
              />
              <Route
                path="*"
                element={
                  <Empty icon={Compass} title="Page not found">
                    Choose a destination in the navigation to get back to
                    campus.
                  </Empty>
                }
              />
            </Routes>
          )}
          <footer className="main-footer">
            <span>
              <Leaf size={13} /> ECO-TWIN · RVCE
            </span>
            <button onClick={() => setModal("sources")}>
              Data sources & limitations <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "auth" && (
        <AuthModal
          onClose={close}
          onDone={async () => {
            await refresh();
            close();
            notify("Welcome to your campus workspace.");
          }}
        />
      )}
      {modal === "report" && (
        <ReportModal
          zones={zones}
          selected={selected}
          pin={mapPin}
          prefill={prefillReport}
          onClose={() => {
            setPrefillReport(null);
            setMapPin(null);
            close();
          }}
          onDone={async () => {
            setPrefillReport(null);
            setMapPin(null);
            await refresh();
            close();
            navigate("/reports");
            notify("Report submitted. You can follow its review here.");
          }}
        />
      )}
      {modal === "detail" && activeReport && (
        <ReportModalDetail
          report={reports.find((r) => r.id === activeReport.id) || activeReport}
          user={user}
          onClose={close}
          onDone={async () => {
            await refresh();
            close();
            notify("Report updated.");
          }}
        />
      )}
      {modal === "evidence" && activeChallenge && (
        <EvidenceModal
          challenge={activeChallenge}
          onClose={close}
          onDone={async () => {
            await refresh();
            close();
            notify(
              "Evidence sent for review. Points are awarded after approval.",
            );
          }}
        />
      )}
      {modal === "review" && activeReview && (
        <ReviewModal
          review={activeReview}
          onClose={close}
          onDone={async () => {
            await refresh();
            close();
            notify("Evidence review saved.");
          }}
        />
      )}
      {modal === "sources" && (
        <Modal
          title="About the data"
          description="RVCE research · Collected 4 November 2026"
          onClose={close}
          wide
        >
          <div className="notice">
            <Info size={20} />
            <p>
              Building footprints and paths come from public OpenStreetMap data.
              Heights and façades are approximations. Published facility figures
              are historical claims, not current meter readings. No live
              environmental feed is connected.
            </p>
          </div>
          <h3>Campus model</h3>
          <p>
            Mapped campus extent: approximately{" "}
            {Math.round(
              (Math.max(...geographic.boundary.map(([x]) => x)) -
                Math.min(...geographic.boundary.map(([x]) => x))) *
                6,
            )}{" "}
            m east to west and{" "}
            {Math.round(
              (Math.max(...geographic.boundary.map(([, z]) => z)) -
                Math.min(...geographic.boundary.map(([, z]) => z))) *
                6,
            )}{" "}
            m north to south, measured between the outermost mapped points.
          </p>
          <p className="muted">
            The geographic view contains 55 building footprints, 143 road/path
            features, 11 open/green polygons and 4 mapped tree points, filtered
            within the community-mapped campus boundary. No complete tree
            inventory is implied. Building levels are used where mapped, with an
            assumed 3.2 m per level; untagged buildings use an assumed 9.6 m.
            North is −Z. The historical view separately reconstructs all 28
            event-map references. Neither is a surveyed, current architectural
            replica.
          </p>
          <a
            className="text-button"
            href="https://www.openstreetmap.org/way/55685638"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors · ODbL <ExternalLink size={14} />
          </a>
          <h3 className="credit-heading">Photographic references</h3>
          {photos.length === 0 && (
            <p className="muted">
              Online campus images were consulted for visual reference. Original
              downloads were blocked; no third-party photo is displayed in this
              build.
            </p>
          )}
          {photos.map((p) => (
            <p className="photo-credit" key={p.key}>
              <a href={p.source_url} target="_blank" rel="noreferrer">
                {p.key} photograph
              </a>{" "}
              · {p.author} ·{" "}
              <a href={p.license_url} target="_blank" rel="noreferrer">
                {p.license}
              </a>
              . Historical image; current appearance may differ.
            </p>
          ))}
          <h3 className="credit-heading">Sources you can trace</h3>
          <p className="muted">
            The workspace includes {facts.length} curated, source-linked campus
            facts. Here are the published claims used in the overview.
          </p>
          <div className="source-list">
            {facts
              .filter((f) =>
                [
                  "F006",
                  "F007",
                  "F009",
                  "F010",
                  "F011",
                  "F012",
                  "F013",
                  "F022",
                  "F027",
                ].includes(f.fact_id),
              )
              .map((f) => (
                <a
                  key={f.fact_id}
                  href={f.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <strong>{f.field.replaceAll("_", " ")}</strong>
                    <small>
                      {f.value} {f.unit} ·{" "}
                      {f.source_period || "Publication date not established"}
                    </small>
                    <p>{f.note}</p>
                  </div>
                  <ExternalLink size={16} />
                </a>
              ))}
          </div>
          <div className="notice subtle">
            <BookOpen size={19} />
            <p>
              Most original institutional pages were inaccessible during
              research. Their claims were recovered from search-indexed content
              and may be stale. Campus area conflicts with older 52-acre
              descriptions; accurate geometry needs an authorised site plan.
            </p>
          </div>
        </Modal>
      )}
      <DebugMode
        user={user}
        setUser={setUser}
        reports={reports}
        setReports={setReports}
        notify={notify}
        openReportModal={() => {
          setPrefillReport({
            title: "Leaking outdoor water tap near walkway",
            category: "Water",
            description:
              "Continuous water drip from plumbing faucet causing puddling on walkway pavement near CSE entrance. Needs washer replacement.",
            zone: selected || "cse",
          });
          setModal("report");
        }}
        setPrefillReportData={setPrefillReport}
      />
    </>
  );
}

function calendarAge(timestamp: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (
    (Date.parse(parts.format(new Date()) + "T00:00:00Z") -
      Date.parse(parts.format(new Date(timestamp)) + "T00:00:00Z")) /
    86400000
  );
}
function Explorer(props: Parameters<typeof ExplorerContent>[0]) {
  return (
    <StudioProvider>
      <ExplorerContent {...props} />
    </StudioProvider>
  );
}
function ExplorerContent({
  onPin,
  factCount,
  zones,
  zone,
  selected,
  onSelect,
  reports,
  onReport,
  onSources,
  onDetail,
}: {
  onPin: (point: MapPoint) => void;
  factCount: number;
  zones: Zone[];
  zone: Zone;
  selected: string;
  onSelect: (s: string) => void;
  reports: Report[];
  onReport: () => void;
  onSources: () => void;
  onDetail: (r: Report) => void;
}) {
  const studio = useStudio()!;
  const display = usePreferences();
  const [view, setView] = useState(display.view),
    [layer, setLayer] = useState("buildings"),
    [query, setQuery] = useState(""),
    [source, setSource] = useState("geographic"),
    [command, setCommand] = useState<{
      type: string;
      tick: number;
      position?: [number, number, number];
      target?: [number, number, number];
      zoom?: number;
    }>({ type: "reset", tick: 0 });
  const [walkTarget, setWalkTarget] = useState("");
  const [activeAsset, setActiveAsset] = useState<InfrastructureAsset | null>(
    null,
  );
  useEffect(() => {
    if (view !== "3d" || source !== "geographic") studio.setMode("explore");
  }, [view, source]);
  const referencePhoto = photos.find((p) => p.key === selected);
  const navigate = useNavigate();
  const commandTo = (type: string) =>
    setCommand((c) => ({ type, tick: c.tick + 1 }));
  const [days, setDays] = useState("30");
  const category =
    (
      { water: "Water", energy: "Energy", waste: "Waste" } as Record<
        string,
        string
      >
    )[layer] || "";
  const reportLayer = layer === "issues" || layer === "heatmap" || !!category;
  const scope = [selected, days, category].join("/");
  const [reportPage, setReportPage] = useState({ scope: "", page: 1 });
  const page = scope === reportPage.scope ? reportPage.page : 1;
  const sample = useSample();
  const serverHistory = useDataset<HistoryData>(
    "analytics/buildings/?" +
      new URLSearchParams({
        zone: selected,
        days,
        category,
        page: String(page),
      }),
    reports,
    !sample.active,
  );
  const history = sample.active
    ? {
        data: sampleHistory(reports, selected, days, category, page),
        error: undefined,
      }
    : serverHistory;
  const activeReportCounts = history?.data?.counts ?? {};
  const heat = useMemo(
    () =>
      reportLayer &&
      !history?.data &&
      Object.keys(activeReportCounts).length === 0
        ? null
        : hotspotLayer(layer, activeReportCounts),
    [layer, history, reportLayer, activeReportCounts],
  );
  const [avoidSteps, setAvoidSteps] = useState(false);
  const walkRoute = useMemo(
    () =>
      walkTarget ? calculateWalkRoute(selected, walkTarget, avoidSteps) : null,
    [selected, walkTarget, avoidSteps],
  );
  const fallback =
    source === "geographic" ? (
      <GeographicMap
        heat={heat}
        selected={selected}
        onSelect={onSelect}
        layer={layer}
        walkRoute={walkRoute}
        onSelectAsset={(asset) => setActiveAsset(asset)}
      />
    ) : (
      <FlatMap selected={selected} onSelect={onSelect} zones={zones} />
    );
  return (
    <>
      <PageHead
        title="Campus explorer"
        description="Find a building, explore the map, or report an issue."
        action={
          <button className="button" onClick={onReport}>
            <Plus size={17} /> Report an issue
          </button>
        }
      />
      <div className="explore-grid">
        <section className="explorer panel">
          <div className="panel-heading">
            <div>
              <h2>
                <span className="green-dot" /> Campus map
              </h2>
              <span className="muted small-text">55 mapped buildings</span>
            </div>
            <div className="segmented" aria-label="Campus view">
              <button
                className={view === "3d" ? "active" : ""}
                onClick={() => setView("3d")}
                aria-pressed={view === "3d"}
              >
                3D view
              </button>
              <button
                className={view === "2d" ? "active" : ""}
                onClick={() => setView("2d")}
                aria-pressed={view === "2d"}
              >
                2D map
              </button>
            </div>
          </div>
          <div className="report-controls">
            <label>
              Report period{" "}
              <select value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">Full history</option>
              </select>
            </label>
            {reportLayer && !history?.data && (
              <small role="status">
                {history?.error || "Loading report totals…"}
              </small>
            )}
          </div>
          <StudioToolbar
            selected={selected}
            activate={() => {
              setView("3d");
              setSource("geographic");
            }}
            onPin={onPin}
          />
          <div className="scene-wrap">
            <div className="scene-toolbar">
              <label className="scene-search">
                <Search size={16} />
                <input
                  placeholder="Find a campus location…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setQuery("");
                  }}
                  aria-label="Find a campus location"
                />
                {query && (
                  <div className="search-results">
                    {zones
                      .filter((z) =>
                        z.name.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((z) => (
                        <button
                          key={z.id}
                          onClick={() => {
                            onSelect(z.id);
                            setQuery("");
                          }}
                        >
                          {z.name}
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    {!zones.some((z) =>
                      z.name.toLowerCase().includes(query.toLowerCase()),
                    ) && <p>No locations found.</p>}
                  </div>
                )}
              </label>
              {view === "3d" &&
                source === "geographic" &&
                !["walk", "panorama"].includes(studio.mode) && (
                  <select
                    aria-label="Camera viewpoint"
                    className="viewpoint-select"
                    defaultValue=""
                    onChange={(e) => {
                      const vp = campusViewpoints.find(
                        (v) => v.id === e.target.value,
                      );
                      if (vp) {
                        setCommand({
                          type: "viewpoint",
                          position: vp.position,
                          target: vp.target,
                          zoom: vp.zoom,
                          tick: command.tick + 1,
                        });
                      }
                    }}
                  >
                    <option value="">Camera viewpoint…</option>
                    {campusViewpoints.map((vp) => (
                      <option key={vp.id} value={vp.id}>
                        {vp.label}
                      </option>
                    ))}
                  </select>
                )}
              <span className="north-label">
                <Navigation size={17} />{" "}
                {source === "geographic"
                  ? view === "2d"
                    ? "North up"
                    : "Mapped campus"
                  : "Schematic"}
              </span>
            </div>
            <div
              className="campus-canvas"
              role="group"
              aria-label={
                studio.mode === "panorama" && studio.panorama
                  ? "Local panoramic viewpoint"
                  : studio.mode === "walk"
                    ? "Ground-level campus model"
                    : "Interactive schematic campus model"
              }
            >
              {view === "3d" ? (
                <SceneBoundary fallback={fallback}>
                  <Suspense fallback={<Loading />}>
                    {source === "geographic" ? (
                      <GeographicScene
                        heat={heat}
                        selected={selected}
                        onSelect={onSelect}
                        layer={layer}
                        command={command}
                        reports={reports.filter(
                          (r) =>
                            (!category || r.category === category) &&
                            (days === "all" ||
                              calendarAge(r.created_at) < Number(days)),
                        )}
                        onReport={onDetail}
                        walkRoute={walkRoute}
                        onSelectAsset={(asset) => setActiveAsset(asset)}
                      />
                    ) : (
                      <Campus
                        selected={selected}
                        onSelect={onSelect}
                        layer={layer}
                        command={command}
                      />
                    )}
                  </Suspense>
                </SceneBoundary>
              ) : (
                fallback
              )}
            </div>
            {studio.mode === "edit" && studio.compare && (
              <div className="comparison-overlay">
                {studio.split > 5 && (
                  <span className="comparison-existing">Existing campus</span>
                )}
                {studio.split < 95 && (
                  <span className="comparison-proposed">Proposed changes</span>
                )}
                <i style={{ left: studio.split + "%" }} />
                <button
                  role="slider"
                  aria-label="Drag comparison divider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={studio.split}
                  aria-orientation="horizontal"
                  className="comparison-handle"
                  style={{
                    left:
                      "clamp(22px, " + studio.split + "%, calc(100% - 22px))",
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    e.preventDefault();
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons !== 1) return;
                    const rect = e.currentTarget
                      .closest(".scene-wrap")!
                      .getBoundingClientRect();
                    studio.setSplit(
                      Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(
                            ((e.clientX - rect.left) / rect.width) * 100,
                          ),
                        ),
                      ),
                    );
                  }}
                  onKeyDown={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                      e.preventDefault();
                      studio.setSplit((v) =>
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 100
                            : Math.max(
                                0,
                                Math.min(
                                  100,
                                  v + (e.key === "ArrowRight" ? 5 : -5),
                                ),
                              ),
                      );
                    }
                  }}
                >
                  ↔
                </button>
              </div>
            )}
            <WalkMiniMap route={walkRoute} />
            <div className="scene-bottom">
              <div className="layer-select">
                <Layers size={15} />
                <select
                  aria-label="Model source"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setLayer("buildings");
                  }}
                >
                  <option value="geographic">OSM footprints</option>
                  <option value="historical">Historical map</option>
                </select>
                <select
                  aria-label="Campus layer"
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                >
                  <option value="buildings">Campus buildings</option>
                  <option value="green">Green spaces</option>
                  {source === "geographic" && (
                    <>
                      <option value="infrastructure">
                        Environmental infrastructure
                      </option>
                      <option value="walkways">Pedestrian walkways</option>
                      <optgroup label="Hotspot layers">
                        {Object.entries(hotspotModes).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
              </div>
              {view === "3d" && !["walk", "panorama"].includes(studio.mode) && (
                <div className="scene-controls">
                  <button
                    type="button"
                    className={`scene-controls-heatmap ${layer === "heatmap" ? "active" : ""}`}
                    onClick={() =>
                      setLayer((l) =>
                        l === "heatmap" ? "buildings" : "heatmap",
                      )
                    }
                    title={
                      layer === "heatmap"
                        ? "Turn off Heatmap Mode"
                        : "Turn on Campus Issue Heatmap Mode"
                    }
                    aria-label="Toggle Heatmap Mode"
                    aria-pressed={layer === "heatmap"}
                  >
                    <Flame size={15} />
                    <span>Heatmap</span>
                  </button>
                  <button aria-label="Zoom in" onClick={() => commandTo("in")}>
                    <Plus size={17} />
                  </button>
                  <button
                    aria-label="Zoom out"
                    onClick={() => commandTo("out")}
                  >
                    <Minus size={17} />
                  </button>
                  <button
                    aria-label="Reset campus view"
                    onClick={() => commandTo("reset")}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    aria-label="Top view"
                    onClick={() => commandTo("top")}
                  >
                    <Grid2X2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {heat && (
            <section className="hotspot-key" aria-label="Hotspot distribution">
              <h3>
                {heat.title} <small>({heat.unit})</small>
              </h3>
              <p>{heat.note}</p>
              <div className="heat-bins">
                {heat.bins.map((bin) => (
                  <div key={bin.label}>
                    <span>
                      <i style={{ background: bin.color }} />
                      {bin.label}
                    </span>
                    <meter
                      min={0}
                      max={geographic.buildings.length}
                      value={bin.count}
                      aria-label={bin.label + " building count"}
                    />
                    <small>{bin.count} buildings</small>
                  </div>
                ))}
              </div>
              <p>
                <strong>Selected building</strong> ·{" "}
                {heat.byId.get(selected)?.name ?? "Outside mapped footprints"}{" "}
                {heat.byId.get(selected)?.label}
              </p>
              {heat.rows[0].value > 0 && (
                <div>
                  <strong>Highest values</strong>
                  <div className="zone-tabs">
                    {heat.rows
                      .filter((r) => r.value > 0)
                      .slice(0, 3)
                      .map((r) => (
                        <button key={r.id} onClick={() => onSelect(r.id)}>
                          {r.name} · {r.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </section>
          )}
          <div className="scene-caption">
            <Info size={14} />
            <span>
              {source === "geographic"
                ? "© OpenStreetMap contributors · ODbL · Heights estimated"
                : "Historical event-map layout · Heights and dimensions approximate"}
            </span>
            <button onClick={onSources}>
              About this model <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="zone-tabs" aria-label="Select campus location">
            {zones
              .filter((z) =>
                [
                  "cse",
                  "admin",
                  "library",
                  "food-court",
                  "parking",
                  "garden",
                ].includes(z.id),
              )
              .map((z) => (
                <button
                  key={z.id}
                  className={selected === z.id ? "active" : ""}
                  aria-pressed={selected === z.id}
                  onClick={() => onSelect(z.id)}
                >
                  {z.id === "garden" ? (
                    <TreePine size={14} />
                  ) : (
                    <MapPin size={14} />
                  )}{" "}
                  {(
                    {
                      cse: "CSE",
                      admin: "Admin Block",
                      library: "Library",
                      "food-court": "Food Court",
                      parking: "Parking",
                      garden: "Green space",
                    } as Record<string, string>
                  )[z.id] || z.name}
                </button>
              ))}
          </div>
        </section>
        <section className="location-panel panel">
          <div className="location-cover">
            <span className="location-chip">
              <MapPin size={13} /> Selected location
            </span>
            {referencePhoto ? (
              <img
                className="location-photo"
                src={
                  "src" in referencePhoto
                    ? String(referencePhoto.src)
                    : "/campus/admin.jpg"
                }
                alt={"Historical photograph of " + zone.name}
              />
            ) : (
              <BuildingArt zone={zone} selected={selected} />
            )}
          </div>
          <div className="location-body">
            <div className="inline-between">
              <span className="eyebrow">{zone?.kind}</span>
              <span className="small-text muted">
                {zone?.map_number
                  ? `Map reference ${zone.map_number}`
                  : "Pilot location"}
              </span>
            </div>
            <h2>{zone?.name}</h2>
            {referencePhoto && (
              <p className="small-text">
                Photo by{" "}
                <a
                  href={referencePhoto.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {referencePhoto.author}, {referencePhoto.year}
                </a>{" "}
                ·{" "}
                <a
                  href={referencePhoto.license_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {referencePhoto.license}
                </a>
                . Historical appearance.
              </p>
            )}
            {zone?.description && (
              <details className="model-details">
                <summary>About this location</summary>
                <p>{zone.description}</p>
              </details>
            )}
            {(() => {
              const building = geographic.buildings.find(
                (p) => p.id === selected,
              );
              if (!building) return null;
              const area = footprintArea(building.points);
              return (
                <section
                  className="mapped-dimensions"
                  aria-label="Mapped dimensions"
                >
                  <h3>Mapped dimensions</h3>
                  <dl>
                    <div>
                      <dt>Footprint</dt>
                      <dd>≈ {Math.round(area).toLocaleString()} m²</dd>
                    </div>
                    <div>
                      <dt>Height</dt>
                      <dd>{building.height_m.toFixed(1)} m</dd>
                    </div>
                  </dl>
                  <details className="model-details">
                    <summary>Scale and sources</summary>
                    <p>{building.height_basis}</p>
                    <p>
                      OpenStreetMap extract · {geographic.retrieved_date}.
                      Building name:{" "}
                      {building.tags.name ? "mapped" : "project label"}.{" "}
                      {referencePhoto
                        ? "Reference photo: " + referencePhoto.year + "."
                        : "No reference photo on file."}
                    </p>
                    <p>Scale: 1 model unit ≈ 6 metres.</p>
                    <a
                      href="https://commons.wikimedia.org/wiki/Category:R.V._College_of_Engineering"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Campus photo sources
                    </a>
                  </details>
                  <a
                    className="text-button"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${geographic.origin_lon_lat[1] - (building.centroid[1] * 6) / 111320},${geographic.origin_lon_lat[0] + (building.centroid[0] * 6) / (111320 * Math.cos((geographic.origin_lon_lat[1] * Math.PI) / 180))}`}
                  >
                    Street View
                  </a>
                </section>
              );
            })()}
            {geographic.buildings.some((p) => p.id === selected) && (
              <a
                className="text-button geometry-source"
                href={
                  geographic.buildings.find((p) => p.id === selected)
                    ?.source_url
                }
                target="_blank"
                rel="noreferrer"
              >
                View mapped footprint <ExternalLink size={12} />
              </a>
            )}
            {buildingDirectory[selected] && (
              <div className="building-directory">
                <div className="section-title-sm">Building directory</div>
                <p className="directory-depts">
                  {buildingDirectory[selected].departments.join(" · ")}
                </p>
                <ul className="floor-list">
                  {buildingDirectory[selected].floors.map((fl, i) => (
                    <li key={i} className="floor-item">
                      {fl}
                    </li>
                  ))}
                </ul>
                {buildingDirectory[selected].facilities.length > 0 && (
                  <div className="facility-tags">
                    {buildingDirectory[selected].facilities.map((fac) => (
                      <span key={fac} className="facility-tag">
                        {fac}
                      </span>
                    ))}
                  </div>
                )}
                <small className="muted">
                  {buildingDirectory[selected].note}
                </small>
              </div>
            )}
            {geographic.buildings.some((p) => p.id === selected) && (
              <div className="walking-route-calculator">
                <div className="section-title-sm">
                  Walking distance from here
                </div>
                <label className="walk-select-label">
                  <span className="muted small-text">Destination</span>
                  <select
                    value={walkTarget}
                    onChange={(e) => setWalkTarget(e.target.value)}
                    aria-label="Walk destination"
                  >
                    <option value="">Select campus destination…</option>
                    {geographic.buildings
                      .filter(
                        (b) => b.id !== selected && !b.id.startsWith("osm-"),
                      )
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="preference-check">
                  <input
                    type="checkbox"
                    checked={avoidSteps}
                    onChange={(e) => setAvoidSteps(e.target.checked)}
                  />
                  Avoid mapped steps
                </label>
                {walkTarget && !walkRoute && (
                  <p role="status">
                    No connected route found in the available map. Try another
                    destination or include mapped steps.
                  </p>
                )}
                {walkRoute && (
                  <div className="walk-metrics">
                    <div className="walk-metric-row">
                      <span>Distance along mapped paths</span>
                      <strong>{walkRoute.walkMeters} m</strong>
                    </div>
                    <div className="walk-metric-row">
                      <span>Estimated walking time</span>
                      <strong>{walkRoute.walkMinutes} min</strong>
                    </div>
                    <div className="walk-metric-row">
                      <span>Activity calories</span>
                      <strong>~{walkRoute.calories} kcal</strong>
                    </div>
                    <div className="walk-metric-row">
                      <span>Avoided vehicle carbon</span>
                      <strong>~{walkRoute.avoidedCarbonGrams} g CO₂e</strong>
                    </div>
                    <small className="muted">
                      Approximate building connections{" "}
                      {walkRoute.startConnector} m and {walkRoute.endConnector}{" "}
                      m. Entrances, gate opening times and accessibility need
                      on-site confirmation.
                    </small>{" "}
                    {walkRoute.steps && (
                      <p>This route includes mapped steps.</p>
                    )}
                    {walkRoute.unknown && (
                      <p>
                        Step-free access has not been confirmed along the full
                        route.
                      </p>
                    )}
                    <ol>
                      <li>
                        From {walkRoute.from.name}, connect to the mapped path
                        (about {walkRoute.startConnector} m).
                      </li>
                      {walkRoute.directions.map((leg, i) => (
                        <li key={i}>
                          Follow {leg.name} for about {Math.round(leg.metres)}{" "}
                          m.
                        </li>
                      ))}
                      <li>
                        Continue to {walkRoute.to.name} (about{" "}
                        {walkRoute.endConnector} m).
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
            <p>
              <strong>Open reports in selected period</strong> ·{" "}
              {history?.data?.counts[selected] ?? (history?.data ? 0 : "—")}
            </p>
            <button
              className="button full"
              onClick={() => navigate(`/simulations?zone=${selected}`)}
            >
              <FlaskConical size={17} /> Explore a what-if scenario{" "}
              <ArrowRight size={15} />
            </button>
            <button className="button secondary full" onClick={onReport}>
              Report an issue here <Plus size={16} />
            </button>
          </div>
        </section>
      </div>
      <CampusPhotos selected={selected} onSelect={onSelect} />
      <Rainwater selected={selected} />
      <Surveys zone={selected} zones={zones} />
      <HistoryPanel
        page={page}
        onPage={(next) => setReportPage({ scope, page: next })}
        name={zone.name}
        data={history?.data}
        error={history?.error}
      />
      <div className="section-heading">
        <div>
          <h2>Campus infrastructure</h2>
          <p>
            Published campus infrastructure. Capacity figures, not live
            consumption.
          </p>
        </div>
        <button className="text-button" onClick={onSources}>
          View sources <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="metric-grid">
        <Metric
          icon={Sun}
          label="Solar installation"
          value="500"
          unit="kWp"
          caption="Published rated capacity"
        />
        <Metric
          icon={WaterWaves}
          label="Sewage treatment"
          value="250"
          unit="kL/day"
          caption="Published output capacity · disputed"
        />
        <Metric
          icon={Grid2X2}
          label="Main campus area"
          value="16.85"
          unit="acres"
          caption="NAAC profile · scope needs confirmation"
        />
        <Metric
          icon={BookOpen}
          label="Campus research"
          value={String(factCount)}
          unit="facts"
          caption="Curated public facts · Nov 2026"
        />
      </div>
      <div className="bottom-grid">
        <section className="panel activity-panel">
          <div className="section-heading">
            <h2>Recent reports</h2>
            <NavLink to="/reports" className="text-button">
              All reports <ArrowRight size={15} />
            </NavLink>
          </div>
          {reports.length ? (
            reports
              .slice(0, 3)
              .map((r) => (
                <ReportRow key={r.id} report={r} onClick={() => onDetail(r)} />
              ))
          ) : (
            <div className="gentle-empty">
              <span className="round-icon">
                <MapPin size={23} />
              </span>
              <div>
                <h3>No reports yet</h3>
                <p>Add a photo and the location of an issue.</p>
              </div>
              <button className="text-button" onClick={onReport}>
                Report an issue <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
        <section className="possibility-card">
          <div>
            <h2>Test a campus change</h2>
            <NavLink to="/simulations">
              Try the what-if studio <ArrowUpRight size={17} />
            </NavLink>
          </div>
          <div className="possibility-art" aria-hidden="true">
            <Sprout size={95} strokeWidth={1} />
            <span />
            <span />
          </div>
        </section>
      </div>
      {activeAsset && (
        <Modal
          title={activeAsset.name}
          description={`Campus environmental infrastructure · ${activeAsset.category}`}
          onClose={() => setActiveAsset(null)}
        >
          <div className="asset-detail-card">
            <div className="asset-stat">
              <span className="muted">Published capacity</span>
              <strong>{activeAsset.capacity}</strong>
            </div>
            <p>{activeAsset.description}</p>
            <div className="notice subtle">
              <strong>Source reference</strong>
              <p>{activeAsset.source}</p>
              <small className="muted">
                Research fact ID: {activeAsset.fact_id}
              </small>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function BuildingArt({
  zone,
  selected,
}: {
  zone?: Zone | null;
  selected?: string;
}) {
  const name = (zone?.name || "").toLowerCase();
  const id = (selected || zone?.id || "").toLowerCase();
  const kind = (zone?.kind || "").toLowerCase();

  // 1. CSE & Computing Department
  if (
    id === "cse" ||
    name.includes("computer science") ||
    name.includes("cse")
  ) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Tech Block Main Wing */}
        <path d="m65 55 105-28 85 35-105 34Z" fill="#eff3e8" />
        <path d="m65 55 85 41v44l-85-44Z" fill="#a8bfa2" />
        <path d="m150 96 105-34v44l-105 34Z" fill="#cdd8c1" />
        {/* Recessed Glass Entrance */}
        <path d="m95 86 35 17v22l-35-17Z" fill="#2d4a3e" />
        <path d="m102 91 22 10v14l-22-10Z" fill="#38bdf8" opacity="0.8" />
        {/* 4 Rooftop Photovoltaic Solar Panels */}
        <path
          d="m80 58 20-5 24 10-20 5Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.8"
        />
        <path
          d="m106 51 20-5 24 10-20 5Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.8"
        />
        <path
          d="m132 44 20-5 24 10-20 5Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.8"
        />
        <path
          d="m158 37 20-5 24 10-20 5Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.8"
        />
        {/* Server Louvers on East Facade */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`m${160 + i * 14} 94 8-2.5v12l-8 2.5Z`}
            fill="#5a7b6b"
          />
        ))}
        {/* Digital Twin Telemetry Mast */}
        <line
          x1="225"
          y1="62"
          x2="225"
          y2="30"
          stroke="#718096"
          strokeWidth="2"
        />
        <circle cx="225" cy="28" r="3" fill="#22c55e" />
        {/* Campus Trees */}
        <path d="M40 120V95m245 28V98" stroke="#8d775f" strokeWidth="3.5" />
        <ellipse cx="40" cy="85" rx="16" ry="24" fill="#65a30d" />
        <ellipse cx="285" cy="88" rx="17" ry="25" fill="#4d7c0f" />
      </svg>
    );
  }

  // 2. Central Library & Information Centre
  if (id === "library" || name.includes("library")) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Academic Library Two-Tier Structure */}
        <path d="m70 60 95-24 90 32-95 30Z" fill="#f5f7f0" />
        <path d="m70 60 70 36v45l-70-38Z" fill="#b4c7af" />
        <path d="m140 96 115-38v45l-115 38Z" fill="#dce4d2" />
        {/* Grand Arched Reading Hall Facade */}
        <path d="m155 90 30-10v35l-30 10Z" fill="#0284c7" opacity="0.75" />
        <path d="m192 78 30-10v35l-30 10Z" fill="#0284c7" opacity="0.75" />
        {/* Skylight Lantern on Roof */}
        <path
          d="m120 48 35-9 30 11-35 9Z"
          fill="#7dd3fc"
          stroke="#0284c7"
          strokeWidth="1"
        />
        {/* Book Stacks Horizontal Windows */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`m80 ${75 + i * 12} 45 22v4l-45-22Z`}
            fill="#4d6b53"
          />
        ))}
        {/* Quiet Shaded Garden Courtyard */}
        <path d="M36 122V96m250 26V98" stroke="#8d775f" strokeWidth="3.5" />
        <ellipse cx="36" cy="86" rx="18" ry="25" fill="#4d7c0f" />
        <ellipse cx="286" cy="88" rx="18" ry="25" fill="#65a30d" />
      </svg>
    );
  }

  // 3. Administration Block
  if (id === "admin" || name.includes("admin")) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Administrative Main Wing */}
        <path d="m60 62 100-24 100 24-100 28Z" fill="#faf6ed" />
        <path d="m60 62 75 35v45l-75-38Z" fill="#c2b69d" />
        <path d="m135 97 125-35v45l-125 35Z" fill="#ded5c0" />
        {/* Neoclassical Pediment Portico */}
        <polygon
          points="120,48 160,25 200,48"
          fill="#efe6cf"
          stroke="#a39073"
          strokeWidth="1"
        />
        {/* 4 Classical Columns */}
        <rect x="135" y="48" width="6" height="42" fill="#ffffff" />
        <rect x="150" y="48" width="6" height="42" fill="#ffffff" />
        <rect x="165" y="48" width="6" height="42" fill="#ffffff" />
        <rect x="180" y="48" width="6" height="42" fill="#ffffff" />
        {/* Central Clock Medallion */}
        <circle
          cx="160"
          cy="38"
          r="6"
          fill="#facc15"
          stroke="#78350f"
          strokeWidth="1"
        />
        {/* Ceremonial Flagpole */}
        <line
          x1="160"
          y1="25"
          x2="160"
          y2="8"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <path d="M160 8 L175 13 L160 18 Z" fill="#22c55e" />
        {/* Landscaped Perimeter Trees */}
        <path d="M35 125V98m255 27V98" stroke="#8d775f" strokeWidth="3.5" />
        <ellipse cx="35" cy="88" rx="16" ry="24" fill="#15803d" />
        <ellipse cx="290" cy="88" rx="16" ry="24" fill="#16a34a" />
      </svg>
    );
  }

  // 4. Food Court / MINGOS Canteen
  if (
    id === "food-court" ||
    name.includes("food") ||
    name.includes("canteen") ||
    name.includes("mingos")
  ) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Octagonal Dining Pavilion Structure */}
        <path d="m80 65 80-22 80 22-80 24Z" fill="#fed7aa" />
        <path d="m80 65 60 30v40l-60-32Z" fill="#c27845" />
        <path d="m140 95 100-30v40l-100 30Z" fill="#e09f67" />
        {/* Open Air Timber Pergola Rafters */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={95 + i * 36}
            y1={60 - i * 3}
            x2={115 + i * 36}
            y2={85 - i * 3}
            stroke="#7c2d12"
            strokeWidth="3"
          />
        ))}
        {/* Outdoor Cafe Parasol */}
        <polygon points="50,92 25,104 75,104" fill="#ef4444" />
        <line
          x1="50"
          y1="104"
          x2="50"
          y2="128"
          stroke="#525252"
          strokeWidth="2.5"
        />
        <circle cx="50" cy="128" r="8" fill="#a8a29e" />
        {/* 3-Stream Waste Segregation Station (Green, Blue, Red Bins) */}
        <rect x="235" y="108" width="10" height="18" rx="2" fill="#16a34a" />
        <rect x="248" y="108" width="10" height="18" rx="2" fill="#2563eb" />
        <rect x="261" y="108" width="10" height="18" rx="2" fill="#dc2626" />
      </svg>
    );
  }

  // 5. Parking, Transit & Gate
  if (
    id === "parking" ||
    name.includes("parking") ||
    name.includes("transport") ||
    name.includes("gate") ||
    kind.includes("transport")
  ) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Solar-Canopy Transit Shelter */}
        <path
          d="m75 55 105-24 95 24-105 24Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
        {/* Support Steel Stanchions */}
        <line
          x1="95"
          y1="75"
          x2="95"
          y2="125"
          stroke="#475569"
          strokeWidth="4"
        />
        <line
          x1="170"
          y1="75"
          x2="170"
          y2="128"
          stroke="#475569"
          strokeWidth="4"
        />
        <line
          x1="250"
          y1="75"
          x2="250"
          y2="125"
          stroke="#475569"
          strokeWidth="4"
        />
        {/* EV Smart Charging Pedestal */}
        <rect x="120" y="98" width="14" height="28" rx="3" fill="#22c55e" />
        <circle cx="127" cy="106" r="3" fill="#ffffff" />
        {/* Parked Commuter Bicycles */}
        <circle
          cx="205"
          cy="118"
          r="9"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
        />
        <circle
          cx="225"
          cy="118"
          r="9"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1="205"
          y1="118"
          x2="215"
          y2="105"
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1="225"
          y1="118"
          x2="215"
          y2="105"
          stroke="#64748b"
          strokeWidth="2"
        />
      </svg>
    );
  }

  // 6. Botanical Garden / Pilot Green Space
  if (
    id === "garden" ||
    kind.includes("green") ||
    name.includes("garden") ||
    name.includes("green space")
  ) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="130"
          ry="16"
          fill="#86efac"
          opacity="0.6"
        />
        {/* Winding Stone Garden Walkway */}
        <path
          d="M40 135 Q140 100 280 135"
          stroke="#d6d3d1"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        {/* Mature Neem / Gulmohar Canopy Layer */}
        <path d="M70 120 V80" stroke="#78350f" strokeWidth="6" />
        <ellipse cx="70" cy="65" rx="32" ry="32" fill="#15803d" />
        <ellipse cx="55" cy="55" rx="24" ry="24" fill="#22c55e" />
        {/* Center Flowering Canopy Tree */}
        <path d="M165 125 V75" stroke="#78350f" strokeWidth="7" />
        <ellipse cx="165" cy="55" rx="38" ry="36" fill="#16a34a" />
        <ellipse cx="185" cy="48" rx="26" ry="26" fill="#86efac" />
        <circle cx="155" cy="50" r="4" fill="#f43f5e" />
        <circle cx="175" cy="42" r="4" fill="#f43f5e" />
        {/* Right Canopy Tree */}
        <path d="M255 120 V85" stroke="#78350f" strokeWidth="5" />
        <ellipse cx="255" cy="70" rx="28" ry="28" fill="#15803d" />
        <ellipse cx="240" cy="60" rx="20" ry="20" fill="#4ade80" />
      </svg>
    );
  }

  // 7. Mechanical / Civil / Biotech / Labs / Other Specialized Departments
  const isMech = name.includes("mech") || name.includes("workshop");
  const isBiotech = name.includes("biotech") || name.includes("chem");
  const isSports =
    name.includes("sport") || name.includes("gym") || name.includes("ground");

  if (isSports) {
    return (
      <svg className="building-art" viewBox="0 0 320 150" aria-hidden="true">
        <ellipse
          cx="160"
          cy="130"
          rx="125"
          ry="14"
          fill="#bed1b7"
          opacity="0.7"
        />
        {/* Curved Barrel Roof Arena */}
        <path d="M70 70 Q160 30 250 70 L250 115 L70 115 Z" fill="#e2e8f0" />
        <path
          d="M70 70 Q160 30 250 70"
          fill="none"
          stroke="#0284c7"
          strokeWidth="4"
        />
        {/* Running Track Markings */}
        <path
          d="M40 135 Q160 115 280 135"
          stroke="#ea580c"
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M40 142 Q160 122 280 142"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="6 4"
        />
        {/* Stadium Floodlight */}
        <line
          x1="285"
          y1="125"
          x2="285"
          y2="40"
          stroke="#64748b"
          strokeWidth="3"
        />
        <polygon points="275,40 295,40 285,30" fill="#facc15" />
      </svg>
    );
  }

  // Default Campus Building with rich architectural details
  return (
    <svg className="building-art" viewBox="0 0 300 145" aria-hidden="true">
      <ellipse
        cx="156"
        cy="124"
        rx="108"
        ry="12"
        fill="#bed1b7"
        opacity="0.7"
      />
      {/* Isometric Building Body */}
      <path d="m70 53 98-27 76 33-97 32Z" fill="#eff0db" />
      <path d="m70 53 77 38v48L70 99Z" fill="#b3c6ae" />
      <path d="m147 91 97-32v48l-97 32Z" fill="#d5dec4" />
      <path d="m84 56 84-23 62 27-83 27Z" fill="#8da899" />
      {/* Windows & Louvers */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`m${158 + i * 16} 94 8-3v13l-8 3Z`} fill="#64887b" />
      ))}
      <path d="m100 81 12 6v16l-12-6Z" fill="#64887b" />
      <path d="m77 103 62 33v4l-62-33Z" fill="#7b9578" />
      {/* 3 Rooftop Solar PV Panels */}
      <path
        d="m177 43 22-6 27 12-23 7Z"
        fill="#38bdf8"
        stroke="#0284c7"
        strokeWidth="0.8"
      />
      <path
        d="m151 50 22-6 27 12-23 7Z"
        fill="#38bdf8"
        stroke="#0284c7"
        strokeWidth="0.8"
      />
      <path
        d="m125 57 22-6 27 12-23 7Z"
        fill="#38bdf8"
        stroke="#0284c7"
        strokeWidth="0.8"
      />
      {/* Campus Trees */}
      <path d="M47 113V82m218 36V87" stroke="#9b8268" strokeWidth="4" />
      <ellipse cx="47" cy="76" rx="16" ry="22" fill="#8ba477" />
      <ellipse cx="265" cy="81" rx="17" ry="24" fill="#9cb88a" />
    </svg>
  );
}

function ReportEvidenceArt({ report: r }: { report: Report }) {
  return (
    <div className="notice">
      <Info size={20} />
      <p>
        {r.sample
          ? "Sample report. No photograph is attached."
          : "No photograph is available for this record."}
      </p>
    </div>
  );
}
function GeographicMap({
  heat,
  selected,
  onSelect,
  layer = "buildings",
  walkRoute,
  onSelectAsset,
}: {
  heat?: Hotspots;
  selected: string;
  onSelect: (s: string) => void;
  layer?: string;
  walkRoute?: ReturnType<typeof calculateWalkRoute> | null;
  onSelectAsset?: (asset: InfrastructureAsset) => void;
}) {
  const boundary = geographic.boundary.map((p) => p.join(",")).join(" ");
  return (
    <svg
      className="geographic-map"
      viewBox="-62 -52 124 104"
      role="group"
      aria-label="Publicly mapped campus footprints"
    >
      <polygon points={boundary} fill="#dce6cb" />
      {geographic.green.map((g) => (
        <polygon
          key={g.osm_id}
          points={g.points.map((p) => p.join(",")).join(" ")}
          fill="#b8cda1"
        />
      ))}
      {geographic.roads.map((r) => {
        const isWalkway =
          r.tags?.highway &&
          ["footway", "pedestrian", "path", "steps"].includes(r.tags.highway);
        const highlightWalk = layer === "walkways" && isWalkway;
        return (
          <polyline
            key={r.osm_id}
            points={r.points.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke={highlightWalk ? "#387844" : "#f8f3e7"}
            strokeWidth={
              highlightWalk ? Math.max(r.width_units, 1.2) : r.width_units
            }
          />
        );
      })}
      {geographic.buildings.map((b) => (
        <polygon
          key={b.osm_id}
          points={b.points.map((p) => p.join(",")).join(" ")}
          fill={
            heat?.byId.get(b.id)?.color ??
            (selected === b.id ? "#7d9d69" : "#bfcab4")
          }
          stroke={selected === b.id ? "#355d38" : "#a9b59b"}
          strokeWidth={selected === b.id ? 0.6 : 0.2}
          onClick={() => onSelect(b.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(b.id);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Select ${b.name}`}
        >
          <title>
            {b.name} {heat?.byId.get(b.id)?.label}
          </title>
        </polygon>
      ))}
      {walkRoute && (
        <polyline
          points={walkRoute.points.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="#d96624"
          strokeWidth={0.7}
          strokeDasharray="1 .4"
        />
      )}

      {(layer === "infrastructure" || layer === "green") &&
        campusInfrastructure.map((asset) => (
          <circle
            key={asset.id}
            cx={asset.centroid_2d[0]}
            cy={asset.centroid_2d[1]}
            r={2.2}
            fill={
              asset.category === "Energy"
                ? "#c77700"
                : asset.category === "Water"
                  ? "#0284c7"
                  : "#16a34a"
            }
            stroke="#ffffff"
            strokeWidth={0.6}
            tabIndex={0}
            role="button"
            aria-label={`${asset.name} (${asset.capacity})`}
            onClick={() => onSelectAsset?.(asset)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectAsset?.(asset);
              }
            }}
          >
            <title>
              {asset.name} · {asset.capacity}
            </title>
          </circle>
        ))}
    </svg>
  );
}
function FlatMap({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (s: string) => void;
  zones: Zone[];
}) {
  return (
    <svg
      className="geographic-map"
      viewBox="-43 -32 94 65"
      role="group"
      aria-label="Historical event-map schematic"
    >
      <rect x="-43" y="-32" width="94" height="65" fill="#e4ebd7" />
      {[-25.5, -3.4, 9.1].map((x) => (
        <path key={x} d={`M${x},-23V29`} stroke="#f6f1e5" strokeWidth="1.3" />
      ))}
      {[-5.3, 1.5, 8.2, 21.5].map((z) => (
        <path key={z} d={`M-35,${z}H22`} stroke="#f6f1e5" strokeWidth="1.3" />
      ))}
      {layout.places.map((p) => (
        <g
          key={p.id}
          role="button"
          tabIndex={0}
          aria-label={`Select ${p.label}`}
          onClick={() => onSelect(p.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(p.id);
            }
          }}
        >
          <rect
            x={p.x - p.w / 2}
            y={p.z - p.d / 2}
            width={p.w}
            height={p.d}
            fill={selected === p.id ? "#81a06a" : p.color}
            stroke={selected === p.id ? "#466c39" : "#a5b696"}
            strokeWidth=".25"
          />
          <text
            x={p.x}
            y={p.z + 0.5}
            textAnchor="middle"
            fill="#405436"
            fontSize="1.5"
          >
            {p.number || "V"}
          </text>
          <title>{p.label}</title>
        </g>
      ))}
    </svg>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  caption,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  unit: string;
  caption: string;
}) {
  return (
    <div className="metric panel">
      <div className="inline-between">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-number">
        {value}
        <span>{unit}</span>
      </div>
      <small>{caption}</small>
    </div>
  );
}
function ReportRow({
  report: r,
  onClick,
}: {
  report: Report;
  onClick: () => void;
}) {
  const Icon = categoryIcon(r.category);
  return (
    <button className="report-row" onClick={onClick}>
      {r.image ? (
        <img
          src={r.image}
          alt=""
          className="report-row-thumb"
          width={44}
          height={44}
          loading="lazy"
        />
      ) : (
        <span
          className={`round-icon cat-${r.category.toLowerCase().replaceAll(" ", "-")}`}
        >
          <Icon size={20} />
        </span>
      )}
      <span className="report-row-copy">
        <strong>{r.title}</strong>
        <small>
          {r.zone_name} · {date(r.created_at)}
        </small>
      </span>
      <span className={`badge ${statusClass(r.status)}`}>{r.status}</span>
      <ChevronRight size={17} />
    </button>
  );
}
function ReportsPage({
  reports,
  user,
  onCreate,
  onDetail,
  onRefresh,
}: {
  reports: Report[];
  user: User | null;
  onCreate: () => void;
  onDetail: (r: Report) => void;
  onRefresh?: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("All reports"),
    [query, setQuery] = useState("");
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>(() =>
    getOfflineReports(),
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  async function syncAllOffline() {
    if (!offlineReports.length) return;
    setSyncing(true);
    setSyncError("");
    try {
      for (const off of [...offlineReports]) {
        const res = await fetch(off.image_data_url);
        const blob = await res.blob();
        const file = new File([blob], off.image_name, {
          type: blob.type || "image/jpeg",
        });
        const form = new FormData();
        form.set("title", off.title);
        form.set("category", off.category);
        form.set("description", off.description);
        form.set("zone", off.zone);
        if (off.map_pin) form.set("map_pin", "true");
        if (off.location_public) form.set("location_public", "true");
        if (off.latitude !== null && off.longitude !== null) {
          form.set("latitude", String(off.latitude));
          form.set("longitude", String(off.longitude));
        }
        form.set("image", file);
        await api("reports/", { method: "POST", body: form });
        removeOfflineReport(off.id);
      }
      setOfflineReports(getOfflineReports());
      if (onRefresh) await onRefresh();
    } catch (err) {
      setSyncError((err as Error).message || "Failed syncing some reports.");
      setOfflineReports(getOfflineReports());
    } finally {
      setSyncing(false);
    }
  }

  const filtered = reports.filter(
    (r) =>
      (filter === "All reports" ||
        (filter === "My reports" && r.mine) ||
        filter === r.status) &&
      `${r.title} ${r.zone_name} ${r.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Issue reports"
        description="Report a problem and track its progress."
        action={
          <button className="button" onClick={onCreate}>
            <Plus size={17} /> Report an issue
          </button>
        }
      />
      <div className="report-summary">
        <div>
          <strong>{reports.length}</strong>
          <span>Visible reports</span>
        </div>
        <div>
          <strong>
            {reports.filter((r) => r.status === "Pending").length}
          </strong>
          <span>Awaiting review</span>
        </div>
        <div>
          <strong>
            {reports.filter((r) => r.status === "Resolved").length}
          </strong>
          <span>Resolved</span>
        </div>
        <p>
          <ShieldCheck size={20} /> Reports are checked by a moderator before
          appearing publicly. Your pending reports stay visible to you.
        </p>
      </div>
      <section className="panel">
        {offlineReports.length > 0 && (
          <div className="notice warning offline-queue-banner">
            <div>
              <strong>{offlineReports.length} queued offline report(s)</strong>
              <p className="small-text">
                Stored in browser storage during campus fieldwork with low
                connectivity.
              </p>
              {syncError && <p className="form-error">{syncError}</p>}
            </div>
            <button
              className="button small"
              onClick={syncAllOffline}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Upload size={15} />
              )}
              {syncing ? "Syncing…" : "Sync to server"}
            </button>
          </div>
        )}
        <div className="list-toolbar">
          <div className="tabs">
            {[
              "All reports",
              ...(user ? ["My reports"] : []),
              "Pending",
              "Verified",
              "Resolved",
            ].map((t) => (
              <button
                key={t}
                className={filter === t ? "active" : ""}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="search-input">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports…"
              aria-label="Search reports"
            />
          </label>
        </div>
        {filtered.length ? (
          <div className="report-list">
            {filtered.map((r) => (
              <ReportRow key={r.id} report={r} onClick={() => onDetail(r)} />
            ))}
          </div>
        ) : (
          <Empty
            icon={MapPin}
            title={query ? "No matching reports" : "No reports yet"}
          >
            {query
              ? "Try another keyword or status."
              : "Report a real observation with a photo and location. Every verified contribution counts."}
          </Empty>
        )}
      </section>
    </>
  );
}
function Dashboard({
  facts,
  reports,
  onSources,
}: {
  facts: Fact[];
  reports: Report[];
  onSources: () => void;
}) {
  return (
    <>
      <PageHead
        title="Environment"
        description="Campus facilities, report trends, and electricity records."
        action={
          <button className="button secondary" onClick={onSources}>
            <BookOpen size={17} /> Data sources
          </button>
        }
      />
      <div className="notice">
        <Info size={20} />
        <p>
          <strong>Published infrastructure, not live measurements.</strong>{" "}
          Capacity figures describe installed infrastructure. Imported
          electricity records appear in the meter pilot below.
        </p>
      </div>
      <div className="metric-grid">
        <Metric
          icon={Sun}
          label="Solar installation"
          value="500"
          unit="kWp"
          caption="Published rated capacity"
        />
        <Metric
          icon={WaterWaves}
          label="STP capacity"
          value="250"
          unit="kL/day"
          caption="Historical claim · source conflict"
        />
        <Metric
          icon={Users}
          label="Food court design"
          value="1,000"
          unit="people"
          caption="Design capacity, not attendance"
        />
        <Metric
          icon={CheckCircle2}
          label="Resolved reports"
          value={String(reports.filter((r) => r.status === "Resolved").length)}
          unit="reports"
          caption="Among the latest 200 visible reports"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel data-table-panel">
          <div className="panel-heading">
            <h2>What we know</h2>
            <span className="badge neutral">Published claims</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Campus asset</th>
                  <th>Published value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {facts
                  .filter((f) =>
                    [
                      "F006",
                      "F007",
                      "F009",
                      "F011",
                      "F012",
                      "F013",
                      "F014",
                    ].includes(f.fact_id),
                  )
                  .map((f) => (
                    <tr key={f.fact_id}>
                      <td>{f.field.replaceAll("_", " ")}</td>
                      <td>
                        {typeof f.value === "number" ? num(f.value) : f.value}{" "}
                        {f.unit}
                      </td>
                      <td>
                        <a
                          href={f.source_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Source for ${f.field.replaceAll("_", " ")}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel data-needed">
          <span className="round-icon">
            <Settings2 size={23} />
          </span>
          <h2>Records still needed</h2>
          {[
            "Building-wise meter readings",
            "Waste quantities and categories",
            "Water consumption records",
            "Geotagged tree inventory",
          ].map((t) => (
            <span className="checklist-item" key={t}>
              <span className="empty-check" />
              {t}
            </span>
          ))}
          <NavLink to="/simulations" className="text-button">
            Explore hypothetical scenarios <ArrowRight size={15} />
          </NavLink>
        </section>
      </div>
      <section className="panel insight" aria-labelledby="campus-records">
        <h2 id="campus-records">Campus records by year</h2>
        <p>
          Published figures and project documents. Each row uses the period and
          campus scope of its source.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Record</th>
                <th>Reported value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {facts
                .filter((f) => f.topic === "campus_archive")
                .sort((a, b) =>
                  (a.source_period ?? "").localeCompare(b.source_period ?? ""),
                )
                .map((f) => (
                  <tr key={f.fact_id}>
                    <td>{f.source_period}</td>
                    <th scope="row">{f.field}</th>
                    <td>
                      {typeof f.value === "number" ? num(f.value) : f.value}{" "}
                      {f.unit}
                    </td>
                    <td>
                      <a
                        href={f.source_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={"View source for " + f.field}
                      >
                        Document
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <Coverage />
      <MeterPanel />
    </>
  );
}

function AuthModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(`auth/${register ? "register" : "login"}/`, {
        method: "POST",
        body: json(data),
      });
      await onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={register ? "Create an account" : "Sign in"}
      description="Save reports, join challenges, and keep your scenarios."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        {register && (
          <>
            <label>
              Your name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
          </>
        )}
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            minLength={3}
            maxLength={40}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </label>
        {register && (
          <small className="muted">
            Use at least 8 characters. Avoid common passwords and your username.
          </small>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button disabled={busy} className="button full">
          {busy ? (
            <Loader2 className="spin" size={17} />
          ) : (
            <ArrowRight size={17} />
          )}{" "}
          {register ? "Create your account" : "Sign in"}
        </button>
        <button
          type="button"
          className="text-button centered"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Already part of the campus? Sign in"
            : "New here? Create an account"}
        </button>
        <details className="demo-help">
          <summary>Local demonstration accounts</summary>
          <p>
            Member: <code>student</code>
            <br />
            Moderator: <code>moderator</code>
            <br />
            Password: <code>See .local/demo-password.txt</code>
          </p>
          <small>
            Created only by the local demo seed command. For shared hosting, use
            real accounts and disable demo seeding.
          </small>
        </details>
      </form>
    </Modal>
  );
}
function ReportModal({
  pin,
  zones,
  selected,
  prefill,
  onClose,
  onDone,
}: {
  pin?: MapPoint | null;
  zones: Zone[];
  selected: string;
  prefill?: {
    title: string;
    category: string;
    description: string;
    zone: string;
  } | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(
      pin ? mapCoordinates(pin) : null,
    ),
    [gpsStatus, setGpsStatus] = useState(""),
    [preview, setPreview] = useState("");
  const [pinActive, setPinActive] = useState(!!pin);
  useEffect(() => {
    if (pin) setZoneVal(selected);
  }, [pin, selected]);
  const [zoneVal, setZoneVal] = useState(prefill?.zone || selected);
  const [categoryVal, setCategoryVal] = useState(prefill?.category || "Waste");
  const [titleVal, setTitleVal] = useState(prefill?.title || "");
  const [descVal, setDescVal] = useState(prefill?.description || "");
  const urlRef = useRef("");

  useEffect(() => {
    if (prefill) {
      if (prefill.zone) setZoneVal(prefill.zone);
      if (prefill.category) setCategoryVal(prefill.category);
      if (prefill.title) setTitleVal(prefill.title);
      if (prefill.description) setDescVal(prefill.description);
    }
  }, [prefill]);
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    if (pinActive && gps) {
      form.set("map_pin", "true");
    }
    if (gps) {
      form.set("latitude", String(gps.latitude));
      form.set("longitude", String(gps.longitude));
    }
    const fileInput = e.currentTarget.elements.namedItem(
      "image",
    ) as HTMLInputElement;
    let file = fileInput?.files?.[0];

    if (sampleState().active) {
      addSampleReport({
        coordinates: gps,
        location_public: form.get("location_public") === "on",
        id: Date.now(),
        title: titleVal,
        description: descVal,
        category: categoryVal,
        zone: zoneVal,
        zone_name: zones.find((z) => z.id === zoneVal)?.name ?? zoneVal,
        status: "Pending",
        assignee: "",
        mine: true,
        author: "Sample student",
        created_at: new Date().toISOString(),
        image: "",
        history: [
          {
            status: "Pending",
            note: "Sample submission",
            created_at: new Date().toISOString(),
          },
        ],
      });
      await onDone();
      setBusy(false);
      return;
    }
    if (!file) {
      setError("Add a photograph of the issue.");
      setBusy(false);
      return;
    }
    const saveOffline = () => {
      if (!file) {
        setError("A photograph is required to save an offline report.");
        setBusy(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        saveOfflineReport({
          id: "offline-" + Date.now(),
          title: String(form.get("title") || ""),
          category: String(form.get("category") || "Waste"),
          description: String(form.get("description") || ""),
          zone: String(form.get("zone") || selected),
          latitude: gps ? gps.latitude : null,
          longitude: gps ? gps.longitude : null,
          image_data_url: String(reader.result || ""),
          map_pin: pinActive && !!gps,
          location_public: form.get("location_public") === "on",
          image_name: file.name,
          created_at: new Date().toISOString(),
        });
        setBusy(false);
        onClose();
        alert(
          "Network connection unavailable. Your report was saved locally and can be synced from the Issue Reports page when you reconnect.",
        );
      };
      reader.onerror = () => {
        setError("Could not read photograph for offline storage.");
        setBusy(false);
      };
      reader.readAsDataURL(file);
    };

    if (!navigator.onLine) {
      saveOffline();
      return;
    }

    try {
      await api("reports/", { method: "POST", body: form });
      await onDone();
    } catch (e) {
      const msg = (e as Error).message || "";
      if (
        !navigator.onLine ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed")
      ) {
        saveOffline();
      } else {
        setError(msg);
        setBusy(false);
      }
    }
  }
  function locate() {
    setPinActive(false);
    if (!navigator.geolocation) {
      setGpsStatus("Location is unavailable. Choose a campus zone manually.");
      return;
    }
    setGpsStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setGpsStatus(
          `Location ready (accuracy ±${Math.round(p.coords.accuracy)} m). Confirm this matches your observation.`,
        );
      },
      (err) => {
        if (err.code === 1) {
          setGpsStatus(
            "Location permission was denied. Your selected campus zone will be used.",
          );
        } else if (err.code === 3) {
          setGpsStatus(
            "Location request timed out. Choose your campus zone manually.",
          );
        } else {
          setGpsStatus(
            "Location was not shared. Choose your campus zone manually.",
          );
        }
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }
  return (
    <Modal
      title="Report an issue"
      description="Photograph the issue and tell us where it needs attention."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="muted small-text">
            Enter custom details or use sample data
          </span>
          <button
            type="button"
            className="text-button"
            style={{
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onClick={() => {
              setTitleVal("Water tap leakage in restroom corridor");
              setCategoryVal("Water");
              setZoneVal(selected || "cse");
              setDescVal(
                "Continuous drip from plumbing faucet causing puddling along the first floor walkway. Needs washer replacement.",
              );
            }}
          >
            <Sparkles size={13} /> Autofill Sample Data
          </button>
        </div>
        <div className="form-two">
          <label>
            Campus location
            <select
              name="zone"
              value={zoneVal}
              onChange={(e) => setZoneVal(e.target.value)}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              name="category"
              value={categoryVal}
              onChange={(e) => setCategoryVal(e.target.value)}
            >
              {["Waste", "Water", "Energy", "Green spaces", "Transport"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <label>
          Give it a short title
          <input
            name="title"
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            placeholder="For example, a leaking tap near the library…"
            required
            minLength={5}
            maxLength={120}
          />
        </label>
        <label>
          What did you notice?
          <textarea
            name="description"
            value={descVal}
            onChange={(e) => setDescVal(e.target.value)}
            rows={3}
            required
            minLength={10}
            maxLength={2000}
            placeholder="Describe the issue and how to find it…"
          />
        </label>
        {pinActive && gps && (
          <div className="notice">
            <div>
              <strong>Map pin selected</strong>
              <p>
                The exact location is visible to you and moderators by default.
              </p>
              <label className="preference-check">
                <input name="location_public" type="checkbox" />
                Show this pin to other viewers after verification
              </label>
            </div>
          </div>
        )}
        <label className="upload-label">
          <span>
            <Plus size={20} />
            <strong>Add a photograph</strong>
            <small>JPEG or PNG · up to 10 MB</small>
          </span>
          <input
            aria-label="Photograph"
            name="image"
            type="file"
            accept="image/jpeg,image/png"
            required={!sampleState().active}
            onChange={(e) => {
              if (urlRef.current) URL.revokeObjectURL(urlRef.current);
              const f = e.target.files?.[0];
              const next = f ? URL.createObjectURL(f) : "";
              urlRef.current = next;
              setPreview(next);
            }}
          />
          {preview && (
            <img
              src={preview}
              alt="Your report photograph preview"
              width={160}
              height={100}
            />
          )}
        </label>
        <div className="gps-section">
          <button
            type="button"
            className="button secondary small"
            onClick={locate}
          >
            <Navigation size={15} /> Use my current location
          </button>
          {gps && (
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setGps(null);
                setPinActive(false);
                setGpsStatus(
                  "Coordinates removed. Your selected campus zone will be used.",
                );
              }}
            >
              Remove coordinates
            </button>
          )}
          <small>
            {gpsStatus ||
              "Optional. Your selected campus zone is enough; GPS is never requested automatically."}
          </small>
        </div>
        <div className="notice subtle">
          <ShieldCheck size={18} />
          <p>
            Your report starts as pending. A moderator verifies it before it
            becomes public and earns 10 eco-points. Verified photos may be
            public; avoid faces or personal details.
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button full" disabled={busy}>
          {busy ? <Loader2 size={17} className="spin" /> : <Send size={17} />}{" "}
          {busy ? "Submitting report…" : "Submit for review"}
        </button>
      </form>
    </Modal>
  );
}
function ReportModalDetail({
  report: r,
  user,
  onClose,
  onDone,
}: {
  report: Report;
  user: User | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const next: { [key: string]: string } = {
    Pending: "Verified",
    Verified: "Assigned",
    Assigned: "In Progress",
    "In Progress": "Resolved",
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);
    setBusy(true);
    setError("");
    const isDemo = r.sample === true;
    try {
      if (!isDemo) {
        await api(`reports/${r.id}/status/`, {
          method: "PATCH",
          body: form,
        });
      }
      r.status = String(data.status);
      if (data.assignee) r.assignee = String(data.assignee);
      r.history.push({
        status: String(data.status),
        note: String(data.note || "Status updated by moderator."),
        created_at: new Date().toISOString(),
      });
      if (isDemo) updateSampleReport(r);
      await onDone();
    } catch (e) {
      if (isDemo) {
        r.status = String(data.status);
        if (data.assignee) r.assignee = String(data.assignee);
        r.history.push({
          status: String(data.status),
          note: String(data.note || "Status updated by moderator."),
          created_at: new Date().toISOString(),
        });
        await onDone();
      } else {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={r.title}
      description={`Report #${r.id} · ${r.zone_name} · ${date(r.created_at)}`}
      onClose={onClose}
      wide
    >
      <div className="report-detail-grid">
        <div>
          {r.image ? (
            <img
              className="report-photo"
              src={r.image}
              alt={`Evidence for ${r.title}`}
              width={500}
              height={330}
            />
          ) : (
            <ReportEvidenceArt report={r} />
          )}
          <div className="inline-between">
            <span className={`badge ${statusClass(r.status)}`}>{r.status}</span>
            <span className="muted small-text">{r.category}</span>
          </div>
          {r.sample && (
            <p className="sample-label">Sample report · illustrated evidence</p>
          )}
          <p>{r.description}</p>
          {r.assignee && <p className="muted">Assigned to {r.assignee}</p>}
        </div>
        <div>
          <RepairEvidence report={r} onDone={onDone} />
          <h3>Status history</h3>
          <div className="timeline">
            {r.history.map((h, i) => (
              <div key={i}>
                <span className="timeline-dot" />
                <strong>{h.status}</strong>
                <small>{date(h.created_at)}</small>
                <p>{h.note}</p>
              </div>
            ))}
          </div>
          {user?.moderator && next[r.status] && (
            <form className="form-stack moderator-form" onSubmit={submit}>
              {r.status === "In Progress" && !r.sample && (
                <label>
                  After-repair photo
                  <input
                    type="file"
                    name="repair_image"
                    accept="image/jpeg,image/png"
                    required
                  />
                </label>
              )}
              <h3>Next step</h3>
              <label>
                Update status
                <select name="status">
                  <option>{next[r.status]}</option>
                  {r.status === "Pending" && <option>Rejected</option>}
                </select>
              </label>
              {r.status === "Verified" && (
                <label>
                  Assign to team
                  <input
                    name="assignee"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="For example, campus facilities…"
                  />
                </label>
              )}
              <label>
                Review note
                <textarea
                  name="note"
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={2}
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save review"} <Check size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
function ChallengesPage({
  challenges,
  onJoin,
  onEvidence,
}: {
  challenges: Challenge[];
  onJoin: (c: Challenge) => void;
  onEvidence: (c: Challenge) => void;
}) {
  return (
    <>
      <PageHead
        title="Challenges"
        description="Join an activity and submit a photo for review."
      />
      <div className="challenge-banner">
        <div>
          <span className="badge light">
            <Sprout size={13} /> How points work
          </span>
          <h2>Complete an activity. Submit your evidence.</h2>
          <p>A moderator checks your submission before points are awarded.</p>
        </div>
        <div className="banner-illustration" aria-hidden="true">
          <TreePine />
          <Sprout />
          <Leaf />
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Available challenges</h2>
        </div>
        <span className="muted small-text">
          {challenges.length} pilot challenges
        </span>
      </div>
      <div className="challenge-grid">
        {challenges.map((c, i) => {
          const Icon = categoryIcon(c.category);
          return (
            <article key={c.id} className="challenge-card panel">
              <div className={`challenge-art art-${i % 3}`}>
                <Icon size={66} strokeWidth={1.1} />
                <span className="points-label">
                  <Award size={14} />
                  {c.points} points
                </span>
                <span className="art-circle" />
              </div>
              <div className="challenge-body">
                <div className="inline-between">
                  <span className="eyebrow">{c.category}</span>
                  {c.status && (
                    <span className={`badge ${statusClass(c.status)}`}>
                      {c.status === "Joined" ? "You’re in" : c.status}
                    </span>
                  )}
                </div>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <p className="challenge-instructions">{c.instructions}</p>
                <div className="challenge-meta">
                  <span>
                    <Users size={14} />
                    {c.participants} joined
                  </span>
                  <span>Until {date(c.ends)}</span>
                </div>
                {c.review_note && (
                  <p className="inline-notice">Moderator: {c.review_note}</p>
                )}
                <button
                  className={`button full ${c.status ? "secondary" : ""}`}
                  disabled={c.status === "Pending" || c.status === "Approved"}
                  onClick={() => (c.status ? onEvidence(c) : onJoin(c))}
                >
                  {c.status === "Approved" ? (
                    <>
                      <Check size={16} /> Completed
                    </>
                  ) : c.status === "Pending" ? (
                    "Evidence under review"
                  ) : c.status ? (
                    <>
                      <Plus size={16} /> Submit evidence
                    </>
                  ) : (
                    <>
                      Take the challenge <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function EvidenceModal({
  challenge: c,
  onClose,
  onDone,
}: {
  challenge: Challenge;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api(`challenges/${c.id}/join/`, { method: "POST", body });
      await onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={c.title}
      description={`${c.points} eco-points after evidence approval`}
      onClose={onClose}
    >
      <p>{c.instructions}</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Tell us about your activity
          <textarea
            name="note"
            required
            minLength={10}
            maxLength={1500}
            rows={4}
          />
        </label>
        <label>
          Activity photograph
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png"
            required
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Sending evidence…" : "Send for review"} <Send size={16} />
        </button>
      </form>
    </Modal>
  );
}
function ReviewModal({
  review: r,
  onClose,
  onDone,
}: {
  review: Review;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title={r.challenge}
      description={`Activity evidence from ${r.user}`}
      onClose={onClose}
    >
      <img
        className="report-photo"
        src={r.image}
        alt="Challenge activity evidence"
        width={500}
        height={300}
      />
      <p>{r.note}</p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          setBusy(true);
          try {
            await api(`reviews/${r.id}/`, {
              method: "PATCH",
              body: json(data),
            });
            await onDone();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Review decision
          <select name="status">
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </label>
        <label>
          Review note
          <textarea name="note" required minLength={3} maxLength={1000} />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save decision"}
        </button>
      </form>
    </Modal>
  );
}
function Moderation({
  reports,
  reviews,
  onDetail,
  onReview,
}: {
  reports: Report[];
  reviews: Review[];
  onDetail: (r: Report) => void;
  onReview: (r: Review) => void;
}) {
  return (
    <>
      <PageHead
        title="Moderation"
        description="Review reports and activity submissions."
      />
      <section className="panel activity-panel">
        <h2>Report queue</h2>
        {reports.filter((r) => !["Resolved", "Rejected"].includes(r.status))
          .length ? (
          reports
            .filter((r) => !["Resolved", "Rejected"].includes(r.status))
            .map((r) => (
              <ReportRow report={r} key={r.id} onClick={() => onDetail(r)} />
            ))
        ) : (
          <Empty icon={ShieldCheck} title="The queue is clear.">
            New reports will appear here for review.
          </Empty>
        )}
      </section>
      <section className="panel activity-panel">
        <h2>Challenge evidence</h2>
        {reviews.length ? (
          reviews.map((r) => (
            <button
              key={r.id}
              className="report-row"
              onClick={() => onReview(r)}
            >
              <span className="round-icon">
                <Award size={20} />
              </span>
              <span className="report-row-copy">
                <strong>{r.challenge}</strong>
                <small>{r.user}</small>
              </span>
              <span className="badge warning">Pending</span>
              <ChevronRight size={17} />
            </button>
          ))
        ) : (
          <Empty icon={Award} title="No activity evidence waiting.">
            Challenge submissions will appear here.
          </Empty>
        )}
      </section>
    </>
  );
}

function SimulationPage({
  zones,
  user,
  saved,
  onAuth,
  refresh,
  notify,
}: {
  zones: Zone[];
  user: User | null;
  saved: Saved[];
  onAuth: () => void;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [params] = useSearchParams();
  const [zone, setZone] = useState(params.get("zone") || "cse"),
    [kind, setKind] = useState("waste"),
    [baseline, setBaseline] = useState("100"),
    [reduction, setReduction] = useState("30"),
    [title, setTitle] = useState("A lighter campus footprint"),
    [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"single" | "campus">("single");
  const [removeId, setRemoveId] = useState<number | null>(null);
  const academicBlocks = useMemo(() => {
    const blocks = geographic.buildings
      .filter((b) => !b.id.startsWith("osm-"))
      .map((b) => {
        const area = Math.round(footprintArea(b.points));
        return { id: b.id, name: b.name, area };
      });
    const totalArea = blocks.reduce((acc, b) => acc + b.area, 0);
    return blocks.map((b) => ({
      ...b,
      share: totalArea > 0 ? b.area / totalArea : 0,
    }));
  }, []);
  const unit =
    kind === "waste"
      ? "kg/day"
      : kind === "energy"
        ? "kWh/day"
        : kind === "water"
          ? "L/day"
          : "kg CO2e/day";
  const dirty = () => setResult(null);
  async function run(save = false) {
    if (save && !user) {
      onAuth();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await api<Result>("simulations/", {
        method: "POST",
        body: json({ zone, kind, baseline, reduction, save, title }),
      });
      setResult(r);
      if (save) {
        await refresh();
        notify("Scenario saved to your profile.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportScenario(s: Saved) {
    const dataToExport =
      scope === "campus" && result
        ? {
            ...s,
            scope: "campus",
            academic_blocks_breakdown: academicBlocks.map((b) => ({
              building_id: b.id,
              name: b.name,
              area_m2: b.area,
              area_share_percent: Math.round(b.share * 1000) / 10,
              baseline_share: Math.round(result.baseline * b.share * 10) / 10,
              savings_share: Math.round(result.saved * b.share * 10) / 10,
              unit: result.unit,
            })),
          }
        : s;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eco-twin-scenario-${s.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHead
        title="What-if studio"
        description="Compare a waste, water, or electricity reduction with your baseline."
      />
      <div className="notice">
        <FlaskConical size={19} />
        <p>
          Results use your inputs and a simple reduction formula. They are
          estimates, not measured campus savings.
        </p>
      </div>
      <div className="simulation-grid">
        <section className="panel simulation-controls">
          <div className="panel-heading">
            <h2>Scenario editor</h2>
            <button
              className="icon-button"
              aria-label="Reset scenario"
              onClick={() => {
                setBaseline(
                  kind === "energy"
                    ? "1000"
                    : kind === "water"
                      ? "10000"
                      : kind === "carbon"
                        ? "500"
                        : "100",
                );
                setReduction(
                  kind === "energy"
                    ? "15"
                    : kind === "water"
                      ? "20"
                      : kind === "carbon"
                        ? "25"
                        : "30",
                );
                dirty();
              }}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <div className="tabs simulation-tabs">
            {[
              { key: "waste", label: "Waste", icon: Recycle },
              { key: "energy", label: "Energy", icon: Zap },
              { key: "water", label: "Water", icon: WaterWaves },
              { key: "carbon", label: "Carbon", icon: Leaf },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={kind === key ? "active" : ""}
                onClick={() => {
                  setKind(key);
                  setBaseline(
                    key === "energy"
                      ? "1000"
                      : key === "water"
                        ? "10000"
                        : key === "carbon"
                          ? "500"
                          : "100",
                  );
                  setReduction(
                    key === "energy"
                      ? "15"
                      : key === "water"
                        ? "20"
                        : key === "carbon"
                          ? "25"
                          : "30",
                  );
                  dirty();
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <div
              className="segmented-scope"
              role="group"
              aria-label="Simulation scope"
            >
              <button
                type="button"
                className={scope === "single" ? "active" : ""}
                onClick={() => setScope("single")}
              >
                Single location
              </button>
              <button
                type="button"
                className={scope === "campus" ? "active" : ""}
                onClick={() => setScope("campus")}
              >
                Campus-wide (All academic blocks)
              </button>
            </div>
            {scope === "single" ? (
              <label>
                Campus location
                <select
                  value={zone}
                  onChange={(e) => {
                    setZone(e.target.value);
                    dirty();
                  }}
                >
                  {zones.map((z) => (
                    <option value={z.id} key={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="notice subtle">
                <strong>Campus-wide calculation</strong>
                <p>
                  Your total hypothetical baseline is distributed across all{" "}
                  {academicBlocks.length} mapped academic blocks pro-rata by
                  footprint area.
                </p>
              </div>
            )}
            <label>
              Hypothetical baseline <span className="input-unit">{unit}</span>
              <input
                type="number"
                value={baseline}
                onChange={(e) => {
                  setBaseline(e.target.value);
                  dirty();
                }}
                min={0}
                max={1e9}
                step="any"
                required
              />
            </label>
            <small className="muted">
              Sample input from the project’s illustrative scenarios. You can
              change it.
            </small>
            <label>
              Scenario template
              <select
                defaultValue=""
                onChange={(e) => {
                  const presets: Record<
                    string,
                    [string, string, string, string]
                  > = {
                    segregation: ["waste", "100", "30", "Waste segregation"],
                    compost: ["waste", "100", "50", "Organic waste composting"],
                    lighting: ["energy", "1000", "15", "Efficient lighting"],
                    equipment: [
                      "energy",
                      "1000",
                      "10",
                      "Equipment shutdown schedule",
                    ],
                    leaks: ["water", "10000", "20", "Leak reduction"],
                    fixtures: [
                      "water",
                      "10000",
                      "30",
                      "Water-efficient fixtures",
                    ],
                    solar_offset: [
                      "carbon",
                      "500",
                      "30",
                      "Rooftop solar grid offset",
                    ],
                    ev_shuttle: [
                      "carbon",
                      "400",
                      "20",
                      "EV campus transit & carpool",
                    ],
                    canopy_offset: [
                      "carbon",
                      "300",
                      "15",
                      "Canopy expansion & green sinks",
                    ],
                  };
                  const p = presets[e.target.value];
                  if (!p) return;
                  setKind(p[0]);
                  setBaseline(p[1]);
                  setReduction(p[2]);
                  setTitle(p[3]);
                  dirty();
                }}
              >
                <option value="">Custom inputs</option>
                <optgroup label="Waste">
                  <option value="segregation">Waste segregation (30%)</option>
                  <option value="compost">Composting (50%)</option>
                </optgroup>
                <optgroup label="Energy">
                  <option value="lighting">Efficient lighting (15%)</option>
                  <option value="equipment">Equipment shutdown (10%)</option>
                </optgroup>
                <optgroup label="Water">
                  <option value="leaks">Leak reduction (20%)</option>
                  <option value="fixtures">
                    Water-efficient fixtures (30%)
                  </option>
                </optgroup>
                <optgroup label="Carbon footprint">
                  <option value="solar_offset">
                    Rooftop solar grid offset (30%)
                  </option>
                  <option value="ev_shuttle">EV transit & carpool (20%)</option>
                  <option value="canopy_offset">
                    Canopy expansion & green sinks (15%)
                  </option>
                </optgroup>
              </select>
              <small>
                Templates supply editable example inputs, not measured
                intervention effects.
              </small>
            </label>
            <div className="reduction-label">
              <label htmlFor="reduction">Reduction to explore</label>
              <span>{reduction}%</span>
            </div>
            <input
              id="reduction"
              aria-label="Reduction percentage"
              type="range"
              min={0}
              max={100}
              value={reduction}
              onChange={(e) => {
                setReduction(e.target.value);
                dirty();
              }}
            />
            <div className="range-labels">
              <span>No change</span>
              <span>100% reduction</span>
            </div>
            <label>
              Scenario name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={17} />
              ) : (
                <FlaskConical size={17} />
              )}{" "}
              Run scenario
            </button>
          </form>
          <div className="formula-note">
            <Lightbulb size={18} />
            <p>
              {kind === "carbon"
                ? "Carbon scenario = baseline × (1 − reduction ÷ 100). Illustrative operational GHG baseline (grid electricity CEA factor ~0.82 kg CO2e/kWh / transit fleet). Not a certified audit."
                : "Scenario = baseline × (1 − reduction ÷ 100). Illustrative linear scenario model."}
            </p>
          </div>
        </section>
        <section className="panel simulation-result">
          <div className="panel-heading">
            <h2>A possible difference</h2>
            <span className="badge neutral">Simulation</span>
          </div>
          {result ? (
            <>
              <div className="result-highlight">
                <span>
                  <ArrowDown size={18} /> Hypothetical reduction
                </span>
                <strong>
                  {num(result.saved)} <small>{result.unit}</small>
                </strong>
                <p>
                  {result.percent === null
                    ? "Percentage undefined for a zero baseline."
                    : `${result.percent}% below your illustrative baseline`}
                </p>
              </div>
              <Suspense fallback={<Loading />}>
                <Comparison result={result} />
              </Suspense>
              <div className="notice subtle">
                <strong>Projected reduction</strong>
                <p>
                  30 days: {num(result.saved * 30)} {result.unit.split("/")[0]}
                  <br />
                  365 days: {num(result.saved * 365)}{" "}
                  {result.unit.split("/")[0]}
                </p>
                {result.unit.includes("CO2e") && (
                  <p className="small-text" style={{ marginTop: "6px" }}>
                    <strong>Illustrative equivalents:</strong> ~
                    {num(Math.round((result.saved * 365) / 22))} mature
                    tree-years of carbon sequestration (~22 kg CO₂/tree/yr) or ~
                    {num(Math.round(result.saved / 0.82))} kWh/day grid
                    electricity offset (CEA grid baseline ~0.82 kg CO₂e/kWh).
                  </p>
                )}
                <meter
                  aria-label="Reduction percentage"
                  min={0}
                  max={100}
                  value={result.percent ?? 0}
                  style={{ width: "100%" }}
                />
                <p>
                  Assumes the same daily baseline and reduction throughout the
                  period.
                </p>
              </div>
              <div className="comparison-numbers">
                <div>
                  <span>Baseline</span>
                  <strong>
                    {num(result.baseline)} <small>{result.unit}</small>
                  </strong>
                </div>
                <ArrowRight size={20} />
                <div>
                  <span>Your scenario</span>
                  <strong>
                    {num(result.scenario)} <small>{result.unit}</small>
                  </strong>
                </div>
              </div>
              {scope === "campus" && (
                <div className="multi-zone-breakdown">
                  <h3>Campus-wide pro-rata distribution</h3>
                  <p className="small-text muted">
                    Area-weighted breakdown across {academicBlocks.length}{" "}
                    mapped academic blocks (Total footprint:{" "}
                    {academicBlocks
                      .reduce((a, b) => a + b.area, 0)
                      .toLocaleString()}{" "}
                    m²).
                  </p>
                  <div className="table-wrap">
                    <table className="multi-zone-table">
                      <thead>
                        <tr>
                          <th>Academic Block</th>
                          <th>Footprint</th>
                          <th>Share</th>
                          <th>Baseline ({result.unit})</th>
                          <th>Projected Savings ({result.unit})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicBlocks.map((b) => {
                          const blockBaseline =
                            Math.round(result.baseline * b.share * 10) / 10;
                          const blockSaved =
                            Math.round(result.saved * b.share * 10) / 10;
                          return (
                            <tr key={b.id}>
                              <td>
                                <strong>{b.name}</strong>
                              </td>
                              <td>{b.area.toLocaleString()} m²</td>
                              <td>{(b.share * 100).toFixed(1)}%</td>
                              <td>{num(blockBaseline)}</td>
                              <td className="highlight-save">
                                −{num(blockSaved)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <button
                className="button secondary"
                disabled={busy || !!result.id}
                onClick={() => run(true)}
              >
                {result.id ? (
                  <>
                    <Check size={16} /> Scenario saved
                  </>
                ) : (
                  <>
                    Save this scenario <Plus size={16} />
                  </>
                )}
              </button>
              <p className="muted small-text">
                Model {result.model_version}. {result.assumptions}
              </p>
            </>
          ) : (
            <div className="simulation-empty">
              <div className="sim-bars" aria-hidden="true">
                <span />
                <span />
                <i>
                  <ArrowDown size={23} />
                </i>
              </div>
              <h3>Ready to compare?</h3>
              <p>
                Set a baseline and a reduction, then run your scenario to
                compare the difference.
              </p>
              <span className="badge neutral">
                Illustrative, repeatable calculations
              </span>
            </div>
          )}
        </section>
      </div>
      <section className="panel simulation-preview">
        <div className="panel-heading">
          <h2>See it in campus context</h2>
          <span className="badge neutral">Hypothetical overlay</span>
        </div>
        <p className="muted">
          The selected building shows your proposed reduction.
        </p>
        <details className="model-details">
          <summary>About the overlay</summary>
          <p>
            Color represents your scenario, not measured conditions. Locations
            without a mapped footprint cannot show an overlay.
          </p>
        </details>
        <div className="simulation-preview-scene">
          <SceneBoundary
            fallback={
              <p className="loading">
                3D unavailable. Your numerical result remains accessible above.
              </p>
            }
          >
            <Suspense fallback={<Loading />}>
              <GeographicScene
                selected={zone}
                onSelect={(id) => {
                  setZone(id);
                  dirty();
                }}
                layer="buildings"
                command={{ type: "reset", tick: 0 }}
                reports={[]}
                onReport={() => {}}
                scenarioReduction={result?.percent}
              />
            </Suspense>
          </SceneBoundary>
        </div>
      </section>
      <Compare saved={saved} />
      <section className="panel saved-scenarios">
        <div className="panel-heading">
          <h2>Saved scenarios</h2>
          <span className="muted small-text">{saved.length} scenarios</span>
        </div>
        {saved.length ? (
          <div className="saved-grid">
            {saved.map((s) => (
              <article key={s.id}>
                <span className="eyebrow">
                  {s.kind} · {date(s.created_at)}
                </span>
                <h3>{s.title}</h3>
                <p>
                  {num(s.result.baseline)} → {num(s.result.scenario)}{" "}
                  {s.result.unit}
                </p>
                <span className="badge neutral">Hypothetical</span>
                <div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setZone(s.zone_id);
                      setKind(s.kind);
                      setBaseline(String(s.result.baseline));
                      setReduction(String(s.result.percent ?? 0));
                      setTitle(`${s.title} — variant`);
                      setResult(null);
                      notify(
                        "Scenario copied into the editor. Change the inputs and save a new version.",
                      );
                    }}
                  >
                    Create variant
                  </button>
                  <button
                    className="text-button"
                    onClick={() => exportScenario(s)}
                  >
                    <Download size={14} /> Export JSON
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() => setRemoveId(s.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty icon={FlaskConical} title="No saved scenarios">
            Save a scenario to revisit or export your inputs and results.
          </Empty>
        )}
      </section>
      {removeId !== null && (
        <Modal
          title="Remove this saved scenario?"
          description="Export a copy first if you want to keep your inputs and results."
          onClose={() => setRemoveId(null)}
        >
          <div className="inline-between">
            <button
              className="button secondary"
              onClick={() => setRemoveId(null)}
            >
              Keep scenario
            </button>
            <button
              className="button"
              onClick={async () => {
                try {
                  await api(`simulations/${removeId}/`, { method: "DELETE" });
                  setRemoveId(null);
                  await refresh();
                  notify("Saved scenario removed.");
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Remove scenario
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function CommunityPage({
  posts,
  zones,
  user,
  onAuth,
  refresh,
  notify,
}: {
  posts: Post[];
  zones: Zone[];
  user: User | null;
  onAuth: () => void;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [body, setBody] = useState(""),
    [zone, setZone] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      onAuth();
      return;
    }
    setBusy(true);
    try {
      await api("posts/", { method: "POST", body: json({ body, zone }) });
      setBody("");
      await refresh();
      notify("Your idea is on the board.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        title="Community"
        description="Suggest a campus improvement or support an idea."
      />
      <div className="community-layout">
        <section>
          <form className="panel compose-post" onSubmit={submit}>
            <label htmlFor="post-body">
              <MessageSquare size={20} /> Your suggestion
            </label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={10}
              maxLength={1500}
              rows={3}
              placeholder="What would you change, and where?"
            />
            <div>
              <label className="sr-only" htmlFor="post-zone">
                Related campus location
              </label>
              <select
                id="post-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="">Campus-wide idea</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              <button className="button small" disabled={busy}>
                {busy ? "Sharing…" : "Share your idea"}
                <Send size={15} />
              </button>
            </div>
          </form>
          {posts.length ? (
            posts.map((p) => (
              <article className="panel community-post" key={p.id}>
                <div className="post-author">
                  <span className="avatar">{p.author[0]}</span>
                  <div>
                    <strong>{p.author}</strong>
                    <small>
                      {p.zone_name} · {date(p.created_at)}
                    </small>
                  </div>
                </div>
                <p>{p.body}</p>
                <button
                  aria-pressed={p.voted}
                  className={`vote-button ${p.voted ? "voted" : ""}`}
                  onClick={async () => {
                    if (!user) {
                      onAuth();
                      return;
                    }
                    try {
                      await api(`posts/${p.id}/vote/`, {
                        method: "POST",
                        body: json({}),
                      });
                      await refresh();
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  <Heart size={16} fill={p.voted ? "currentColor" : "none"} />
                  {p.votes} {p.votes === 1 ? "supporter" : "supporters"}
                </button>
              </article>
            ))
          ) : (
            <section className="panel">
              <Empty icon={MessageSquare} title="No suggestions yet">
                Share an idea here. Use Issue reports for problems that need
                fixing.
              </Empty>
            </section>
          )}
        </section>
        <aside className="panel community-guide">
          <Sprout size={35} />
          <h2>Suggest a change</h2>
          <p>Name the place and explain what you would change.</p>
          <hr />
          <h3>Ideas to start with</h3>
          <p>Where could we improve waste segregation?</p>
          <p>What would make walking around campus easier?</p>
          <p>How can we encourage reusable bottles?</p>
          <NavLink to="/reports" className="text-button">
            Need to report an issue? <ArrowRight size={15} />
          </NavLink>
        </aside>
      </div>
    </>
  );
}
function Profile({
  user,
  onAuth,
  onSignOut,
  reports,
  onDetail,
  saved,
}: {
  user: User | null;
  onAuth: () => void;
  onSignOut: () => void;
  reports: Report[];
  onDetail: (r: Report) => void;
  saved: Saved[];
}) {
  if (!user)
    return (
      <div className="panel signed-out">
        <Empty icon={Users} title="Sign in to view your profile">
          Track your reports, challenges, and saved scenarios.
        </Empty>
        <button className="button" onClick={onAuth}>
          Sign in <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <>
      <PageHead
        title="Your profile"
        description="Your reports, points, and saved scenarios."
        action={
          <button className="button secondary" onClick={onSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        }
      />
      <section className="profile-banner">
        <span className="profile-avatar">{user.name[0]}</span>
        <div>
          <h2>{user.name}</h2>
          <p>
            @{user.username} ·{" "}
            {user.moderator ? "Campus moderator" : "Campus contributor"}
          </p>
        </div>
        <div className="profile-points">
          <Award size={25} />
          <strong>{user.points}</strong>
          <span>verified eco-points</span>
        </div>
      </section>
      <div className="profile-stats">
        <div>
          <MapPin />
          <strong>{user.reports}</strong>
          <span>Reports submitted</span>
        </div>
        <div>
          <CheckCircle2 />
          <strong>{user.challenges}</strong>
          <span>Challenges completed</span>
        </div>
        <div>
          <FlaskConical />
          <strong>{saved.length}</strong>
          <span>Scenarios saved</span>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <h2>Your verified contributions</h2>
          {user.rewards.length ? (
            <div className="reward-list">
              {user.rewards.map((r) => (
                <div key={r.id}>
                  <span className="round-icon">
                    <Award size={20} />
                  </span>
                  <span>
                    <strong>{r.description}</strong>
                    <small>{date(r.created_at)}</small>
                  </span>
                  <b>+{r.points}</b>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={Award} title="No verified contributions yet">
              Eco-points appear after a moderator verifies your report or
              challenge evidence.
            </Empty>
          )}
        </section>
        <section className="panel activity-panel">
          <h2>Badges</h2>
          {user.badges.length ? (
            user.badges.map((b) => (
              <div className="earned-badge" key={b}>
                <Award size={25} />
                <span>{b}</span>
                <CheckCircle2 size={17} />
              </div>
            ))
          ) : (
            <Empty icon={Trophy} title="No badges yet">
              Earn 10 verified eco-points for your first recognition.
            </Empty>
          )}
          <p className="muted small-text">
            Eco-points recognise participation. They are not a measure of carbon
            saved or waste removed.
          </p>
        </section>
      </div>
      <section className="panel activity-panel">
        <h2>Your reports</h2>
        {reports
          .filter((r) => r.mine)
          .map((r) => (
            <ReportRow key={r.id} report={r} onClick={() => onDetail(r)} />
          ))}
        {!reports.some((r) => r.mine) && (
          <p className="muted">Your submitted reports will appear here.</p>
        )}
      </section>
    </>
  );
}
