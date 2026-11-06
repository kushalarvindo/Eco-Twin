import { useSample, setSample } from "./samples";
import { useState, useEffect } from "react";
import {
  Bug,
  Sparkles,
  Users,
  Database,
  PenTool,
  X,
  ShieldCheck,
  UserCheck,
  Layers,
} from "lucide-react";
import type { User, Report } from "./types";

import {
  DEMO_CLIENT_STUDENT,
  DEMO_CLIENT_MODERATOR,
  DEMO_REPORTS_50,
  getDemoReportsBatch,
  getAll50DemoReports,
} from "./demo-data";

export { DEMO_CLIENT_STUDENT, DEMO_CLIENT_MODERATOR };
export const DEMO_REPORTS = DEMO_REPORTS_50;

interface DebugModeProps {
  user: User | null;
  setUser: (u: User | null) => void;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  notify: (msg: string) => void;
  openReportModal: () => void;
  setPrefillReportData?: (data: {
    title: string;
    category: string;
    description: string;
    zone: string;
  }) => void;
}

export function DebugMode({
  user,
  setUser: _setUser,
  reports,
  setReports: _setReports,
  notify,
  openReportModal,
  setPrefillReportData,
}: DebugModeProps) {
  const sample = useSample();
  const debugActive = sample.active;
  const setDebugActive = (active: boolean) => setSample({ active });
  const setUser = (u: User | null) =>
    setSample({ role: u?.moderator ? "moderator" : u ? "student" : "visitor" });
  const setReports: React.Dispatch<React.SetStateAction<Report[]>> = (
    action,
  ) => {
    const reports =
      typeof action === "function" ? action(sample.reports) : action;
    setSample({
      reports: reports.map((r) => ({ ...r, sample: true as const })),
    });
  };
  const [panelOpen, setPanelOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    localStorage.setItem("ecotwin_debug_mode", String(debugActive));
    if (debugActive) {
      document.documentElement.setAttribute("data-debug-mode", "true");
    } else {
      document.documentElement.removeAttribute("data-debug-mode");
    }
  }, [debugActive]);

  // Main Action: Fill First 10 Reports with Dummy Clients & Enable custom data entry
  const fillAllDemoData = () => {
    if (!user) {
      setUser(DEMO_CLIENT_STUDENT);
    }

    setReports((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newBatch = DEMO_REPORTS_50.slice(0, 10).filter(
        (r) => !existingIds.has(r.id),
      );
      return [...newBatch, ...prev];
    });

    if (setPrefillReportData) {
      setPrefillReportData({
        title: "Water tap leakage in restroom corridor",
        category: "Water",
        description:
          "Continuous drip from faucet causing puddling along the first floor walkway. Needs washer replacement.",
        zone: "cse",
      });
    }

    setDebugActive(true);
    notify(
      "Sample data loaded: Student client active, 10 campus reports populated. All forms are pre-filled and editable.",
    );
  };

  const switchClient = async (role: "student" | "moderator" | "visitor") => {
    setSample({ active: true, role });
    notify("Sample client selected. Changes stay in this browser.");
  };

  // Injects 10 more reports per click from the 50-report pool
  const injectReportsBatch = () => {
    const toAdd = getDemoReportsBatch(reports, 10);
    if (!toAdd.length) {
      notify(
        "All 50 campus demonstration reports are already loaded into view.",
      );
      return;
    }
    setReports((prev) => [...toAdd, ...prev]);
    notify(
      `Injected ${toAdd.length} more reports (Total: ${reports.length + toAdd.length} active reports across campus).`,
    );
  };

  // Loads all 50 campus reports at once
  const loadAll50Reports = () => {
    const all = getAll50DemoReports();
    setReports((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const missing = all.filter((r) => !existingIds.has(r.id));
      return [...missing, ...prev];
    });
    notify(
      "Loaded all 50 campus demonstration reports across all 55 RVCE buildings!",
    );
  };

  const handleToggle = () => {
    if (!debugActive) {
      setDebugActive(true);
      fillAllDemoData();
      setPanelOpen(true);
    } else {
      setPanelOpen(!panelOpen);
    }
  };

  return (
    <>
      {/* Floating Hover Button at the bottom */}
      <div
        className="debug-hover-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          className={`debug-hover-btn ${debugActive ? "active" : ""}`}
          onClick={handleToggle}
          aria-label="Toggle Debug Mode"
          title="Toggle Debug & Demo Mode"
        >
          <div className="debug-btn-content">
            <Bug size={16} className="debug-icon" />
            <span className="debug-text">
              {debugActive ? "DEBUG MODE" : "DEBUG MODE"}
            </span>
            <span
              className={`debug-status-dot ${debugActive ? "active" : ""}`}
            />
          </div>
          {isHovered && (
            <span className="debug-hover-hint">
              {debugActive
                ? panelOpen
                  ? "Hide Tools"
                  : "Show Tools"
                : "Click to Fill Demo Data"}
            </span>
          )}
        </button>
      </div>

      {/* Floating Debug Tools Drawer / Tray */}
      {debugActive && panelOpen && (
        <div className="debug-panel" role="region" aria-label="Debug Tools">
          <div className="debug-panel-header">
            <div className="debug-panel-title">
              <Sparkles size={16} />
              <strong>Debug & Demo Mode</strong>
              <span className="badge-active">Active</span>
            </div>
            <button
              type="button"
              className="modal-close-button"
              aria-label="Close Debug Panel"
              onClick={() => setPanelOpen(false)}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <p className="debug-panel-desc">
            Dummy data is populated with {reports.length} reports. You can test
            workflows, inject more data, or edit any custom values.
          </p>

          <div className="debug-actions-grid">
            {/* Quick Fill 10 */}
            <button
              type="button"
              className="debug-action-card"
              onClick={fillAllDemoData}
            >
              <WandIcon size={16} />
              <div>
                <strong>Fill Demo Data (10 Reports)</strong>
                <small>Populates dummy clients & initial batch</small>
              </div>
            </button>

            {/* Inject Next 10 Reports */}
            <button
              type="button"
              className="debug-action-card"
              onClick={injectReportsBatch}
            >
              <Database size={16} />
              <div>
                <strong>Inject +10 More Reports</strong>
                <small>Click to add 10 more (up to 50 samples)</small>
              </div>
            </button>

            {/* Load All 50 Reports */}
            <button
              type="button"
              className="debug-action-card"
              onClick={loadAll50Reports}
            >
              <Layers size={16} />
              <div>
                <strong>Load All 50 Campus Reports</strong>
                <small>Full campus hotspot density & heatmap test</small>
              </div>
            </button>

            {/* Open Pre-filled Report Form */}
            <button
              type="button"
              className="debug-action-card"
              onClick={() => {
                if (setPrefillReportData) {
                  setPrefillReportData({
                    title: "Leaking outdoor water tap near walkway",
                    category: "Water",
                    description:
                      "Continuous water drip from plumbing faucet causing puddling on walkway pavement near CSE entrance. Needs washer replacement.",
                    zone: "cse",
                  });
                }
                openReportModal();
              }}
            >
              <PenTool size={16} />
              <div>
                <strong>Test Report Form</strong>
                <small>Opens editable pre-filled issue report</small>
              </div>
            </button>
          </div>

          {/* Quick Client Switcher */}
          <div className="debug-client-switcher">
            <span className="switcher-label">
              <Users size={14} /> Active Client Persona:
            </span>
            <div className="client-buttons">
              <button
                type="button"
                className={
                  user && !user.moderator ? "client-btn active" : "client-btn"
                }
                onClick={() => switchClient("student")}
              >
                <UserCheck size={13} /> Student (Kushal)
              </button>
              <button
                type="button"
                className={
                  user && user.moderator ? "client-btn active" : "client-btn"
                }
                onClick={() => switchClient("moderator")}
              >
                <ShieldCheck size={13} /> Faculty Reviewer (Dr. Shashikiran)
              </button>
              <button
                type="button"
                className={!user ? "client-btn active" : "client-btn"}
                onClick={() => switchClient("visitor")}
              >
                Visitor (Logged out)
              </button>
            </div>
          </div>

          {/* Turn off */}
          <div className="debug-panel-footer">
            <span className="muted small-text">
              User: <strong>{user ? user.name : "Anonymous"}</strong> · Reports:{" "}
              <strong>{reports.length}</strong>
            </span>
            <button
              type="button"
              className="text-button danger-text"
              onClick={() => {
                setDebugActive(false);
                setPanelOpen(false);
                notify("Debug Mode turned off.");
              }}
            >
              Turn off Debug Mode
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function WandIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
}
