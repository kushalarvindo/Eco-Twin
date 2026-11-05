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
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  FlaskConical,
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
const photos = photoData as {
  key: string;
  source_url: string;
  author: string;
  license: string;
  license_url: string;
}[];
const Comparison = lazy(() => import("./Comparison"));
const navigation = [
  { to: "/", label: "Campus explorer", icon: Compass },
  { to: "/reports", label: "Issue reports", icon: MapPin },
  { to: "/dashboard", label: "Environment", icon: Grid2X2 },
  { to: "/simulations", label: "What-if studio", icon: FlaskConical },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/community", label: "Community", icon: Users },
];
const categoryIcon = (cat: string) =>
  cat === "Energy"
    ? Zap
    : cat === "Water"
      ? WaterWaves
      : cat === "Green spaces"
        ? TreePine
        : Recycle;
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
      <Loader2 className="spin" size={22} /> Getting things ready…
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
        <Dialog.Content className={`modal ${wide ? "wide" : ""}`}>
          <div className="modal-head">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
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
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [zones, setZones] = useState<Zone[]>([]),
    [facts, setFacts] = useState<Fact[]>([]),
    [reports, setReports] = useState<Report[]>([]),
    [challenges, setChallenges] = useState<Challenge[]>([]),
    [posts, setPosts] = useState<Post[]>([]),
    [saved, setSaved] = useState<Saved[]>([]),
    [reviews, setReviews] = useState<Review[]>([]);
  const [ready, setReady] = useState(false),
    [bootError, setBootError] = useState(""),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(""),
    [activeReport, setActiveReport] = useState<Report | null>(null),
    [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null),
    [activeReview, setActiveReview] = useState<Review | null>(null),
    [mobileMenu, setMobileMenu] = useState(false);
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
      setSaved(await api<Saved[]>("simulations/"));
      if (s.user.moderator) setReviews(await api<Review[]>("reviews/"));
      else setReviews([]);
    } else {
      setSaved([]);
      setReviews([]);
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
            <small>A better campus, together</small>
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
            <h3>A little goes a long way.</h3>
            <p>Your next small action could make a big difference.</p>
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
                <LogIn size={16} /> Join the campus
              </button>
            )}
          </div>
        </header>
        <main id="main">
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
                  <Empty icon={Compass} title="That path isn’t on our map.">
                    Choose a destination in the navigation to get back to
                    campus.
                  </Empty>
                }
              />
            </Routes>
          )}
          <footer className="main-footer">
            <span>
              <Leaf size={13} /> Made for a campus that cares.
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
          onClose={close}
          onDone={async () => {
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
          title="A clearer picture starts with honest data."
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
          <h3>Geometry you can trace</h3>
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
function Explorer({
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
  const reportLayer = layer === "issues" || !!category;
  const scope = [selected, days, category].join("/");
  const [reportPage, setReportPage] = useState({ scope: "", page: 1 });
  const page = scope === reportPage.scope ? reportPage.page : 1;
  const history = useDataset<HistoryData>(
    "analytics/buildings/?" +
      new URLSearchParams({
        zone: selected,
        days,
        category,
        page: String(page),
      }),
    reports,
  );
  const heat = useMemo(
    () =>
      reportLayer && !history?.data
        ? null
        : hotspotLayer(layer, history?.data?.counts ?? {}),
    [layer, history, reportLayer],
  );
  const walkRoute = useMemo(
    () => (walkTarget ? calculateWalkRoute(selected, walkTarget) : null),
    [selected, walkTarget],
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
        eyebrow="Explore. Understand. Make a difference."
        title="Your campus. A greener possibility."
        description="See the bigger picture. Start with the place right around you."
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
                <span className="green-dot" /> Campus explorer
              </h2>
              <span className="muted small-text">
                55 mapped footprints. One shared campus.
              </span>
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
              {view === "3d" && source === "geographic" && (
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
              aria-label="Interactive schematic campus model"
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
              {view === "3d" && (
                <div className="scene-controls">
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
            {selected === "admin" && photos.some((p) => p.key === "admin") ? (
              <img
                className="location-photo"
                src="/campus/admin.jpg"
                alt="Historical photograph of RVCE Administrative Block"
              />
            ) : (
              <BuildingArt />
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
            {selected === "admin" && (
              <p className="small-text">
                Photo:{" "}
                <a
                  href="https://commons.wikimedia.org/wiki/File:RV_College_Admin_block.JPG"
                  target="_blank"
                  rel="noreferrer"
                >
                  Rvian00, 2009
                </a>{" "}
                ·{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/3.0/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CC BY-SA 3.0
                </a>
                . Historical appearance.
              </p>
            )}
            <p>{zone?.description}</p>
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
                  <p>{building.height_basis}</p>
                  <p>
                    OpenStreetMap extract · {geographic.retrieved_date}.
                    Building name:{" "}
                    {building.tags.name ? "mapped" : "project label"}.{" "}
                    {selected === "admin"
                      ? "Reference photo: 2009."
                      : "No reference photo on file."}
                  </p>
                  <p>Scale: 1 model unit ≈ 6 metres.</p>
                  <a
                    className="text-button"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${geographic.origin_lon_lat[1] - (building.centroid[1] * 6) / 111320},${geographic.origin_lon_lat[0] + (building.centroid[0] * 6) / (111320 * Math.cos((geographic.origin_lon_lat[1] * Math.PI) / 180))}`}
                  >
                    Open nearby Street View
                  </a>
                  <p>Coverage and capture date are provided by Google Maps.</p>
                  <a
                    className="text-button"
                    target="_blank"
                    rel="noreferrer"
                    href="https://commons.wikimedia.org/wiki/Category:R.V._College_of_Engineering"
                  >
                    Campus photograph references
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
                {walkRoute && (
                  <div className="walk-metrics">
                    <div className="walk-metric-row">
                      <span>Walking distance (paved paths)</span>
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
                      Direct distance {walkRoute.straightMeters} m × 1.25
                      walkway circuity factor @ 1.2 m/s.
                    </small>
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
      <HistoryPanel
        page={page}
        onPage={(next) => setReportPage({ scope, page: next })}
        name={zone.name}
        data={history?.data}
        error={history?.error}
      />
      <div className="section-heading">
        <div>
          <h2>A little context, a better perspective.</h2>
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
          label="Research, with a source"
          value={String(factCount)}
          unit="facts"
          caption="Curated public facts · Nov 2026"
        />
      </div>
      <div className="bottom-grid">
        <section className="panel activity-panel">
          <div className="section-heading">
            <h2>From observation to action</h2>
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
                <h3>Notice something that needs care?</h3>
                <p>A photo and a location are a good place to start.</p>
              </div>
              <button className="text-button" onClick={onReport}>
                Make the first report <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
        <section className="possibility-card">
          <div>
            <span className="eyebrow">Small changes. Thoughtful choices.</span>
            <h2>
              What could a greener
              <br />
              campus look like?
            </h2>
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
function BuildingArt() {
  return (
    <svg className="building-art" viewBox="0 0 300 145" aria-hidden="true">
      <ellipse cx="156" cy="124" rx="108" ry="12" fill="#bed1b7" />
      <path d="m70 53 98-27 76 33-97 32Z" fill="#eff0db" />
      <path d="m70 53 77 38v48L70 99Z" fill="#b3c6ae" />
      <path d="m147 91 97-32v48l-97 32Z" fill="#d5dec4" />
      <path d="m84 56 84-23 62 27-83 27Z" fill="#8da899" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`m${158 + i * 16} 94 8-3v13l-8 3Z`} fill="#64887b" />
      ))}
      <path d="m100 81 12 6v16l-12-6Z" fill="#64887b" />
      <path d="m77 103 62 33v4l-62-33Z" fill="#7b9578" />
      <path d="m177 43 22-6 27 12-23 7Z" fill="#527587" />
      <path d="m151 50 22-6 27 12-23 7Z" fill="#527587" />
      <path d="m125 57 22-6 27 12-23 7Z" fill="#527587" />
      <path d="M47 113V82m218 36V87" stroke="#9b8268" strokeWidth="4" />
      <ellipse cx="47" cy="76" rx="16" ry="22" fill="#8ba477" />
      <ellipse cx="265" cy="81" rx="17" ry="24" fill="#9cb88a" />
    </svg>
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
        <line
          x1={walkRoute.from.centroid[0]}
          y1={walkRoute.from.centroid[1]}
          x2={walkRoute.to.centroid[0]}
          y2={walkRoute.to.centroid[1]}
          stroke="#1b5e20"
          strokeWidth="1.5"
          strokeDasharray="2,2"
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
      <span
        className={`round-icon cat-${r.category.toLowerCase().replaceAll(" ", "-")}`}
      >
        <Icon size={20} />
      </span>
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
        eyebrow="A shared space deserves shared care"
        title="Notice it. Report it. Follow it through."
        description="Turn everyday observations into a better campus for everyone."
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
          <span>Resolved with care</span>
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
            title={
              query ? "No matching reports" : "A fresh start for campus care."
            }
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
        eyebrow="Environment, with context"
        title="Understand what’s here. See what’s missing."
        description="A transparent view of campus infrastructure and the data behind it."
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
          <h2>
            Good data makes
            <br />
            better decisions.
          </h2>
          <p>
            The next step is connecting authorised records and campus surveys.
          </p>
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
      title={
        register ? "Make your first positive step." : "Welcome back to campus."
      }
      description="Your contributions, all in one place."
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
  zones,
  selected,
  onClose,
  onDone,
}: {
  zones: Zone[];
  selected: string;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(
      null,
    ),
    [gpsStatus, setGpsStatus] = useState(""),
    [preview, setPreview] = useState("");
  const urlRef = useRef("");
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
    if (gps) {
      form.set("latitude", String(gps.latitude));
      form.set("longitude", String(gps.longitude));
    }
    const fileInput = e.currentTarget.elements.namedItem(
      "image",
    ) as HTMLInputElement;
    const file = fileInput?.files?.[0];

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
      title="A small observation. A positive start."
      description="Photograph the issue and tell us where it needs attention."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="form-two">
          <label>
            Campus location
            <select name="zone" defaultValue={selected}>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category">
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
            rows={3}
            required
            minLength={10}
            maxLength={2000}
            placeholder="Describe the issue and how to find it…"
          />
        </label>
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
            required
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
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      await api(`reports/${r.id}/status/`, {
        method: "PATCH",
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
      title={r.title}
      description={`Report #${r.id} · ${r.zone_name} · ${date(r.created_at)}`}
      onClose={onClose}
      wide
    >
      <div className="report-detail-grid">
        <div>
          <img
            className="report-photo"
            src={r.image}
            alt={`Evidence for ${r.title}`}
            width={500}
            height={330}
          />
          <div className="inline-between">
            <span className={`badge ${statusClass(r.status)}`}>{r.status}</span>
            <span className="muted small-text">{r.category}</span>
          </div>
          <p>{r.description}</p>
          {r.assignee && <p className="muted">Assigned to {r.assignee}</p>}
        </div>
        <div>
          <h3>The journey so far</h3>
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
        eyebrow="Good habits grow together"
        title="Small actions. Real participation."
        description="Pick a challenge, show your effort, and build a habit that lasts."
      />
      <div className="challenge-banner">
        <div>
          <span className="badge light">
            <Sprout size={13} /> Your next positive step
          </span>
          <h2>
            A greener campus
            <br />
            starts with all of us.
          </h2>
          <p>No grand gestures needed. Just a little intention, every day.</p>
        </div>
        <div className="banner-illustration" aria-hidden="true">
          <TreePine />
          <Sprout />
          <Leaf />
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Find your next challenge</h2>
          <p>Evidence is reviewed. Points recognise verified participation.</p>
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
        eyebrow="Care, backed by a little verification"
        title="Help good contributions move forward."
        description="Review evidence, coordinate action, and recognise verified effort."
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
        eyebrow="The what-if studio"
        title="Imagine a change. Explore its possibilities."
        description="Try a hypothetical intervention and compare it with a baseline."
      />
      <div className="notice">
        <FlaskConical size={19} />
        <p>
          <strong>A space for possibilities, not predictions.</strong> Inputs
          are illustrative. Results are simple reduction scenarios, not measured
          environmental improvements.
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
                  <option value="fixtures">Water-efficient fixtures (30%)</option>
                </optgroup>
                <optgroup label="Carbon footprint">
                  <option value="solar_offset">Rooftop solar grid offset (30%)</option>
                  <option value="ev_shuttle">EV transit & carpool (20%)</option>
                  <option value="canopy_offset">Canopy expansion & green sinks (15%)</option>
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
                    <strong>Illustrative equivalents:</strong> ~{num(Math.round((result.saved * 365) / 22))} mature tree-years of carbon sequestration (~22 kg CO₂/tree/yr) or ~{num(Math.round(result.saved / 0.82))} kWh/day grid electricity offset (CEA grid baseline ~0.82 kg CO₂e/kWh).
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
              <h3>A small change can open up possibilities.</h3>
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
          The highlighted footprint is where your scenario applies. Color shows
          your selected reduction, not measured environmental conditions. Choose
          a mapped building for an overlay; historical-only references have no
          verified footprint here.
        </p>
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
          <h2>Your saved possibilities</h2>
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
          <Empty icon={FlaskConical} title="Your possibilities belong here.">
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
        eyebrow="A campus full of good ideas"
        title="Better together, one conversation at a time."
        description="Share an observation, suggest an improvement, or support a thoughtful idea."
      />
      <div className="community-layout">
        <section>
          <form className="panel compose-post" onSubmit={submit}>
            <label htmlFor="post-body">
              <MessageSquare size={20} /> What could we do better, together?
            </label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={10}
              maxLength={1500}
              rows={3}
              placeholder="Share a practical idea for a more sustainable campus…"
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
              <Empty
                icon={MessageSquare}
                title="Every good idea starts somewhere."
              >
                Be the first to suggest a thoughtful improvement. Report urgent
                environmental issues through Issue reports.
              </Empty>
            </section>
          )}
        </section>
        <aside className="panel community-guide">
          <Sprout size={35} />
          <h2>
            A little thoughtfulness
            <br />
            goes a long way.
          </h2>
          <p>
            Keep ideas practical, respectful, and specific to a place or habit.
          </p>
          <hr />
          <h3>A few good starting points</h3>
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
        <Empty icon={Users} title="Your positive footprint starts here.">
          Join the campus to track your reports, challenges and saved scenarios.
        </Empty>
        <button className="button" onClick={onAuth}>
          Join the campus <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <>
      <PageHead
        eyebrow="Your campus contribution"
        title={`Small steps, ${user.name.split(" ")[0]}. They add up.`}
        description="A record of the effort you’ve put into your shared space."
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
            <Empty
              icon={Award}
              title="Every contribution begins with a first step."
            >
              Eco-points appear after a moderator verifies your report or
              challenge evidence.
            </Empty>
          )}
        </section>
        <section className="panel activity-panel">
          <h2>Recognition that’s earned</h2>
          {user.badges.length ? (
            user.badges.map((b) => (
              <div className="earned-badge" key={b}>
                <Award size={25} />
                <span>{b}</span>
                <CheckCircle2 size={17} />
              </div>
            ))
          ) : (
            <Empty icon={Trophy} title="Your first badge is ahead.">
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
