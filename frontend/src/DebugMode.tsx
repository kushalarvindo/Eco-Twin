import { useState, useEffect } from "react";
import {
  Bug,
  Sparkles,
  Users,
  Database,
  PenTool,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { User, Report, Zone } from "./types";

export const DEMO_CLIENT_STUDENT: User = {
  id: 101,
  name: "Aarav Sharma (Student)",
  username: "student",
  email: "aarav.sharma@example.test",
  moderator: false,
  points: 45,
  reports: 3,
  challenges: 2,
  badges: ["Campus Explorer", "Water Guardian", "Green Step"],
  rewards: [
    {
      id: 1,
      description: "Verified report: Leaking water tap",
      points: 10,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 2,
      description: "Completed challenge: Switch off lab equipment",
      points: 15,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 3,
      description: "Verified report: Food court compost bin",
      points: 10,
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 4,
      description: "Completed challenge: Plastic-free day",
      points: 10,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ],
};

export const DEMO_CLIENT_MODERATOR: User = {
  id: 102,
  name: "Dr. K. S. Rao (Staff Reviewer)",
  username: "moderator",
  email: "ksrao.staff@example.test",
  moderator: true,
  points: 120,
  reports: 8,
  challenges: 5,
  badges: ["Staff Reviewer", "Eco Champion", "Campus Steward", "Audit Master"],
  rewards: [
    {
      id: 11,
      description: "Moderator onboarding",
      points: 50,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 12,
      description: "Verified campus energy audit",
      points: 70,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ],
};

export const DEMO_REPORTS: Report[] = [
  {
    id: 901,
    title: "Leaking outdoor water tap near walkway",
    category: "Water",
    description:
      "Continuous water drip from plumbing faucet causing puddling on walkway pavement near CSE entrance. Needs washer replacement.",
    zone: "cse",
    zone_name: "Computer Science",
    status: "Verified",
    assignee: "Campus Estate Maintenance",
    mine: true,
    author: "Aarav Sharma (Student)",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    image: "",
    history: [
      {
        status: "Pending",
        note: "Submitted for review.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        status: "Verified",
        note: "Verified on ground by staff.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 902,
    title: "Overflowing segregation bin at Food Court",
    category: "Waste",
    description:
      "Wet waste bin overflowing near food court exit. Needs clearing and extra bin placement during peak lunch hours.",
    zone: "food-court",
    zone_name: "MINGOS Food Court",
    status: "In Progress",
    assignee: "Housekeeping Supervisor",
    mine: false,
    author: "Pooja V.",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    image: "",
    history: [
      {
        status: "Pending",
        note: "Reported.",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        status: "Verified",
        note: "Confirmed issue.",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        status: "Assigned",
        note: "Assigned to Housekeeping.",
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        status: "In Progress",
        note: "Bins being cleared.",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: 903,
    title: "Unattended corridor lighting left on midday",
    category: "Energy",
    description:
      "High-power corridor tube lights left on throughout sunny afternoon in 3rd floor hallway.",
    zone: "admin",
    zone_name: "Administration",
    status: "Resolved",
    assignee: "Electrical Maintenance",
    mine: false,
    author: "Rohan M.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    image: "",
    history: [
      {
        status: "Pending",
        note: "Reported.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        status: "Verified",
        note: "Verified.",
        created_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
      },
      {
        status: "In Progress",
        note: "Switched off & timer switch installed.",
        created_at: new Date(Date.now() - 86400000 * 1.2).toISOString(),
      },
      {
        status: "Resolved",
        note: "Timers active.",
        created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      },
    ],
  },
  {
    id: 904,
    title: "Damaged sapling protective mesh",
    category: "Green spaces",
    description:
      "Protective bamboo mesh around young tree near botanical garden has fallen over after yesterday's rain.",
    zone: "garden",
    zone_name: "Pilot green space",
    status: "Verified",
    assignee: "Horticulture Team",
    mine: false,
    author: "Sneha K.",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    image: "",
    history: [
      {
        status: "Pending",
        note: "Reported.",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        status: "Verified",
        note: "Mesh support needed.",
        created_at: new Date(Date.now() - 86400000 * 0.4).toISOString(),
      },
    ],
  },
  {
    id: 905,
    title: "Bicycle rack overcrowding at Gate 1",
    category: "Transport",
    description:
      "Pedestrian walkway obstructed by bicycles due to lack of marked parking slots near the gate.",
    zone: "parking",
    zone_name: "Pilot parking zone",
    status: "Pending",
    assignee: "",
    mine: true,
    author: "Aarav Sharma (Student)",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    image: "",
    history: [
      {
        status: "Pending",
        note: "Submitted for review.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
];

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
  setUser,
  reports,
  setReports,
  notify,
  openReportModal,
  setPrefillReportData,
}: DebugModeProps) {
  const [debugActive, setDebugActive] = useState<boolean>(() => {
    return localStorage.getItem("ecotwin_debug_mode") === "true";
  });
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

  // Main Action: Fill All Data with Dummy Clients & Enable custom data entry
  const fillAllDemoData = () => {
    // 1. Set demo user (if not already logged in as moderator, set student)
    if (!user) {
      setUser(DEMO_CLIENT_STUDENT);
    }

    // 2. Populate demo reports (preserving any user-created ones)
    setReports((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newReports = DEMO_REPORTS.filter((r) => !existingIds.has(r.id));
      return [...newReports, ...prev];
    });

    // 3. Pre-fill report form data so the user can review and edit freely
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
      "Demo data loaded: Student client active, 5 campus reports populated. All forms are pre-filled and editable.",
    );
  };

  const switchClient = (role: "student" | "moderator" | "visitor") => {
    if (role === "student") {
      setUser(DEMO_CLIENT_STUDENT);
      notify("Active Client: Aarav Sharma (Student Member)");
    } else if (role === "moderator") {
      setUser(DEMO_CLIENT_MODERATOR);
      notify("Active Client: Dr. K. S. Rao (Staff Reviewer)");
    } else {
      setUser(null);
      notify("Active Client: Visitor (Logged Out)");
    }
  };

  const injectReports = () => {
    setReports((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = DEMO_REPORTS.filter((r) => !existingIds.has(r.id));
      return [...toAdd, ...prev];
    });
    notify("5 demonstration campus reports injected into view.");
  };

  const handleToggle = () => {
    if (!debugActive) {
      // Turning ON: activate and fill demo data immediately
      setDebugActive(true);
      fillAllDemoData();
      setPanelOpen(true);
    } else {
      // Toggle panel or turn off
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
              className="icon-button"
              aria-label="Close Debug Panel"
              onClick={() => setPanelOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          <p className="debug-panel-desc">
            Dummy data is populated. You can test workflows or directly enter and
            edit any custom values in all forms.
          </p>

          <div className="debug-actions-grid">
            {/* Quick Fill All */}
            <button
              type="button"
              className="debug-action-card"
              onClick={fillAllDemoData}
            >
              <WandIcon size={16} />
              <div>
                <strong>Fill All Demo Data</strong>
                <small>Populates dummy clients & reports</small>
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

            {/* Seed 5 Reports */}
            <button
              type="button"
              className="debug-action-card"
              onClick={injectReports}
            >
              <Database size={16} />
              <div>
                <strong>Inject 5 Demo Reports</strong>
                <small>Adds verified/progress issues to map</small>
              </div>
            </button>
          </div>

          {/* Quick Client Switcher */}
          <div className="debug-client-switcher">
            <span className="switcher-label">
              <Users size={14} /> Active Client:
            </span>
            <div className="client-buttons">
              <button
                type="button"
                className={
                  user && !user.moderator
                    ? "client-btn active"
                    : "client-btn"
                }
                onClick={() => switchClient("student")}
              >
                <UserCheck size={13} /> Student (Aarav)
              </button>
              <button
                type="button"
                className={
                  user && user.moderator ? "client-btn active" : "client-btn"
                }
                onClick={() => switchClient("moderator")}
              >
                <ShieldCheck size={13} /> Staff Reviewer (Dr. Rao)
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
              Active User: <strong>{user ? user.name : "Anonymous"}</strong>
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
