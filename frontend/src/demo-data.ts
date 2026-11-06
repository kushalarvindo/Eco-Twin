import type { User, Report } from "./types";

// Realistic SVG Data URIs for campus field evidence
export const DEMO_IMG_WATER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a3d31"/>
      <stop offset="100%" stop-color="#18241c"/>
    </linearGradient>
    <radialGradient id="puddle" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#1f6feb" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0d419d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pipe" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#aa8c2c"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#bg)"/>
  <rect x="0" y="0" width="500" height="200" fill="#223328"/>
  <rect x="0" y="190" width="500" height="15" fill="#1b2820"/>
  <rect x="195" y="40" width="22" height="130" fill="url(#pipe)" rx="3"/>
  <path d="M217 140 h35 v35 h-20 v-15 h-15 z" fill="url(#pipe)"/>
  <rect x="235" y="125" width="30" height="8" rx="3" fill="#cf3b30"/>
  <circle cx="250" cy="129" r="3" fill="#ffffff"/>
  <circle cx="242" cy="225" r="3.5" fill="#79c0ff"/>
  <circle cx="243" cy="248" r="4" fill="#a5d6ff"/>
  <ellipse cx="245" cy="275" rx="130" ry="32" fill="url(#puddle)"/>
  <rect x="18" y="18" width="220" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#3fb950" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#f85149"/>
  <text x="48" y="36" fill="#7ee787" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • WATER</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Plumbing Line • Active Leakage</text>
</svg>
`);

export const DEMO_IMG_WASTE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2d372e"/>
      <stop offset="100%" stop-color="#18231a"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#bg2)"/>
  <rect x="0" y="195" width="500" height="135" fill="#202c22"/>
  <rect x="95" y="120" width="80" height="120" rx="6" fill="#1d4ed8"/>
  <rect x="210" y="120" width="80" height="120" rx="6" fill="#15803d"/>
  <rect x="325" y="120" width="80" height="120" rx="6" fill="#b91c1c"/>
  <text x="135" y="180" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">DRY</text>
  <text x="250" y="180" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">WET</text>
  <text x="365" y="180" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">SPECIAL</text>
  <rect x="220" y="80" width="34" height="22" rx="2" fill="#d97706" transform="rotate(12 237 91)"/>
  <rect x="18" y="18" width="230" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#f59e0b" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#f59e0b"/>
  <text x="48" y="36" fill="#fcd34d" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • WASTE</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Receptacle Station • Overflowing</text>
</svg>
`);

export const DEMO_IMG_ENERGY =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="hall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3a30"/>
      <stop offset="100%" stop-color="#141e17"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#eab308" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ca8a04" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="330" fill="url(#hall)"/>
  <polygon points="120,40 380,40 330,220 170,220" fill="#1c2820"/>
  <polygon points="170,220 330,220 500,330 0,330" fill="#243429"/>
  <rect x="180" y="55" width="140" height="12" rx="2" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
  <ellipse cx="250" cy="70" rx="90" ry="25" fill="url(#lampGlow)"/>
  <rect x="18" y="18" width="240" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#eab308" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#eab308"/>
  <text x="48" y="36" fill="#fde047" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • ENERGY</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Lighting Fixture • Daytime Idle</text>
</svg>
`);

export const DEMO_IMG_GARDEN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a29"/>
      <stop offset="100%" stop-color="#14241a"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#sky)"/>
  <path d="M0 210 Q250 190 500 210 L500 330 L0 330 Z" fill="#2d4231"/>
  <path d="M250 270 Q248 180 250 110" stroke="#78350f" stroke-width="8" stroke-linecap="round" fill="none"/>
  <circle cx="250" cy="95" r="32" fill="#22c55e" opacity="0.95"/>
  <circle cx="230" cy="85" r="24" fill="#4ade80" opacity="0.9"/>
  <circle cx="270" cy="88" r="26" fill="#16a34a" opacity="0.9"/>
  <g transform="rotate(-22 250 260)">
    <line x1="215" y1="260" x2="215" y2="120" stroke="#ca8a04" stroke-width="4"/>
    <line x1="240" y1="260" x2="240" y2="115" stroke="#ca8a04" stroke-width="4"/>
    <line x1="265" y1="260" x2="265" y2="115" stroke="#ca8a04" stroke-width="4"/>
    <ellipse cx="250" cy="180" rx="38" ry="8" fill="none" stroke="#eab308" stroke-width="2.5"/>
  </g>
  <rect x="18" y="18" width="245" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#4ade80" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#4ade80"/>
  <text x="48" y="36" fill="#86efac" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • GREEN</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Canopy Guard • Mesh Leaning</text>
</svg>
`);

export const DEMO_IMG_PARKING =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="bgP" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#223026"/>
      <stop offset="100%" stop-color="#141d17"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#bgP)"/>
  <rect x="0" y="170" width="500" height="160" fill="#1b241c"/>
  <path d="M90 200 V140 Q110 120 130 140 V200" fill="none" stroke="#94a3b8" stroke-width="5"/>
  <path d="M170 200 V140 Q190 120 210 140 V200" fill="none" stroke="#94a3b8" stroke-width="5"/>
  <circle cx="100" cy="185" r="18" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="145" cy="185" r="18" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="280" cy="195" r="18" fill="none" stroke="#f43f5e" stroke-width="3"/>
  <rect x="290" y="225" width="130" height="24" rx="4" fill="#e11d48"/>
  <text x="355" y="241" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">WALKWAY OBSTRUCTED</text>
  <rect x="18" y="18" width="240" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#38bdf8" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#38bdf8"/>
  <text x="48" y="36" fill="#7dd3fc" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • MOBILITY</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Transit Hub • Bicycle Overcrowding</text>
</svg>
`);

export const DEMO_IMG_CARBON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 330" width="500" height="330">
  <defs>
    <linearGradient id="bgC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#163829"/>
      <stop offset="100%" stop-color="#0c2016"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#bgC)"/>
  <circle cx="250" cy="165" r="75" fill="none" stroke="#34d399" stroke-width="3" stroke-dasharray="8 6"/>
  <circle cx="250" cy="165" r="50" fill="#065f46" opacity="0.8"/>
  <path d="M250 135 C240 145 230 160 250 185 C270 160 260 145 250 135 Z" fill="#34d399"/>
  <rect x="18" y="18" width="250" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#34d399" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#34d399"/>
  <text x="48" y="36" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • CARBON AUDIT</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Scope 1/2 Emissions Optimization</text>
</svg>
`);

export const DEMO_CLIENT_STUDENT: User = {
  id: 101,
  name: "Kushal (Student)",
  username: "kushal",
  email: "kushal@example.test",
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
  name: "Dr. Shashikiran (Faculty Reviewer)",
  username: "shashikiran",
  email: "shashikiran.faculty@example.test",
  moderator: true,
  points: 120,
  reports: 8,
  challenges: 5,
  badges: ["Faculty Reviewer", "Eco Champion", "Campus Steward", "Audit Master"],
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

export const DEMO_REPORTS_50: Report[] = [
  {
    id: 901,
    title: "Leaking outdoor water tap near walkway",
    category: "Water",
    description: "Continuous water drip from plumbing faucet causing puddling on walkway pavement near CSE entrance. Needs washer replacement.",
    zone: "cse",
    zone_name: "Computer Science Department",
    status: "Verified",
    assignee: "Campus Estate Maintenance",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 150).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 150).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 148).toISOString(),
      },
    ],
  },
  {
    id: 902,
    title: "Overflowing segregation bin at Food Court",
    category: "Waste",
    description: "Wet waste bin overflowing near food court exit. Needs clearing and extra bin placement during peak lunch hours.",
    zone: "food-court",
    zone_name: "Big Mingos Food Court",
    status: "In Progress",
    assignee: "Housekeeping Supervisor",
    mine: false,
    author: "Campus Member #11",
    created_at: new Date(Date.now() - 3600000 * 147).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 147).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 145).toISOString(),
      },
    ],
  },
  {
    id: 903,
    title: "Unattended corridor lighting left on midday",
    category: "Energy",
    description: "High-power corridor tube lights left on throughout sunny afternoon in 3rd floor hallway.",
    zone: "admin",
    zone_name: "Administration Building",
    status: "Resolved",
    assignee: "Electrical Maintenance",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 144).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 144).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 142).toISOString(),
      },
    ],
  },
  {
    id: 904,
    title: "Damaged sapling protective mesh",
    category: "Green spaces",
    description: "Protective bamboo mesh around young tree near botanical garden has fallen over after yesterday rain.",
    zone: "garden",
    zone_name: "Pilot green space",
    status: "Verified",
    assignee: "Horticulture Team",
    mine: false,
    author: "Campus Member #13",
    created_at: new Date(Date.now() - 3600000 * 141).toISOString(),
    image: DEMO_IMG_GARDEN,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 141).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 139).toISOString(),
      },
    ],
  },
  {
    id: 905,
    title: "Bicycle rack overcrowding at Gate 1",
    category: "Transport",
    description: "Pedestrian walkway obstructed by bicycles due to lack of marked parking slots near the gate.",
    zone: "parking",
    zone_name: "Gate 1 Transit Hub",
    status: "Pending",
    assignee: "",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 138).toISOString(),
    image: DEMO_IMG_PARKING,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 138).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 136).toISOString(),
      },
    ],
  },
  {
    id: 906,
    title: "CS Lab 3 idle workstation displays",
    category: "Energy",
    description: "24 desktop monitors left powered on in stand-by mode overnight across rows B and C.",
    zone: "cse",
    zone_name: "Computer Science Department",
    status: "Verified",
    assignee: "Lab Technical Assistant",
    mine: false,
    author: "Campus Member #15",
    created_at: new Date(Date.now() - 3600000 * 135).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 135).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 133).toISOString(),
      },
    ],
  },
  {
    id: 907,
    title: "Unsorted cardboard carton packaging pile",
    category: "Waste",
    description: "Hardware packaging cartons discarded next to CSE ground floor emergency stairwell.",
    zone: "cse",
    zone_name: "Computer Science Department",
    status: "Pending",
    assignee: "",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 132).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 132).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 130).toISOString(),
      },
    ],
  },
  {
    id: 908,
    title: "Server room cooling temperature sub-optimal",
    category: "Carbon",
    description: "Server rack inlet temp set at 18C instead of recommended 24C baseline, causing excess chiller energy draw.",
    zone: "cse",
    zone_name: "Computer Science Department",
    status: "Assigned",
    assignee: "Facility Energy Team",
    mine: false,
    author: "Campus Member #17",
    created_at: new Date(Date.now() - 3600000 * 129).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 129).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 127).toISOString(),
      },
    ],
  },
  {
    id: 909,
    title: "RO drinking water dispenser drain overflow",
    category: "Water",
    description: "Drip tray drain pipe on 1st floor water dispenser clogged with paper napkins causing spillage.",
    zone: "library",
    zone_name: "Central Library",
    status: "In Progress",
    assignee: "Estate Plumber",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 126).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 126).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 124).toISOString(),
      },
    ],
  },
  {
    id: 910,
    title: "Reading hall AC running with open terrace door",
    category: "Energy",
    description: "Central chillers running while exterior emergency balcony door propped open by study desk.",
    zone: "library",
    zone_name: "Central Library",
    status: "Verified",
    assignee: "Library Attendant",
    mine: false,
    author: "Campus Member #19",
    created_at: new Date(Date.now() - 3600000 * 123).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 123).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 121).toISOString(),
      },
    ],
  },
  {
    id: 911,
    title: "E-waste collection bin full of discarded cables",
    category: "Waste",
    description: "Designated battery and cable recycling receptacle at library entrance has reached capacity.",
    zone: "library",
    zone_name: "Central Library",
    status: "Verified",
    assignee: "Recycling Contractor",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 118).toISOString(),
      },
    ],
  },
  {
    id: 912,
    title: "Terrace planter box soil dry and cracking",
    category: "Green spaces",
    description: "Native medicinal potted shrubs on 2nd floor library terrace need scheduled drip irrigation.",
    zone: "library",
    zone_name: "Central Library",
    status: "Pending",
    assignee: "",
    mine: false,
    author: "Campus Member #21",
    created_at: new Date(Date.now() - 3600000 * 117).toISOString(),
    image: DEMO_IMG_GARDEN,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 117).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 115).toISOString(),
      },
    ],
  },
  {
    id: 913,
    title: "Rooftop solar PV string 4 shading by cabling",
    category: "Energy",
    description: "Loose telecom conduit droops over corner monocrystalline panels, degrading string output.",
    zone: "admin",
    zone_name: "Administration Building",
    status: "Assigned",
    assignee: "Solar O&M Team",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 114).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 114).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 112).toISOString(),
      },
    ],
  },
  {
    id: 914,
    title: "Garden irrigation valve slow seepage",
    category: "Water",
    description: "Underground ball valve near placement lobby seeping approx 2 L/hr into landscaped flower bed.",
    zone: "admin",
    zone_name: "Administration Building",
    status: "Verified",
    assignee: "Estate Maintenance",
    mine: false,
    author: "Campus Member #23",
    created_at: new Date(Date.now() - 3600000 * 111).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 111).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 109).toISOString(),
      },
    ],
  },
  {
    id: 915,
    title: "Fleet diesel van idling during dispatch",
    category: "Carbon",
    description: "Campus logistics van left idling engine for 35 minutes outside store entrance.",
    zone: "admin",
    zone_name: "Administration Building",
    status: "Resolved",
    assignee: "Transport Coordinator",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 108).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 108).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 106).toISOString(),
      },
    ],
  },
  {
    id: 916,
    title: "Dish washing sink faucet high pressure spray",
    category: "Water",
    description: "Pre-rinse kitchen faucet flow rate measured above 12 L/min; aerator restrictor recommended.",
    zone: "food-court",
    zone_name: "Big Mingos Food Court",
    status: "Verified",
    assignee: "Canteen Operations",
    mine: false,
    author: "Campus Member #25",
    created_at: new Date(Date.now() - 3600000 * 105).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 105).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 103).toISOString(),
      },
    ],
  },
  {
    id: 917,
    title: "Single-use plastic cutlery sighting",
    category: "Waste",
    description: "Stall 4 issuing non-compostable plastic spoons violating campus zero-waste code.",
    zone: "food-court",
    zone_name: "Big Mingos Food Court",
    status: "Assigned",
    assignee: "Health & Hygiene Committee",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 102).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 102).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 100).toISOString(),
      },
    ],
  },
  {
    id: 918,
    title: "Biogas unit raw food waste feedstock sorting",
    category: "Carbon",
    description: "Citrus peels and high-cellulose stalks entering anaerobic digester batch feed.",
    zone: "food-court",
    zone_name: "Big Mingos Food Court",
    status: "In Progress",
    assignee: "Biogas Unit Supervisor",
    mine: false,
    author: "Campus Member #27",
    created_at: new Date(Date.now() - 3600000 * 99).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 99).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 97).toISOString(),
      },
    ],
  },
  {
    id: 919,
    title: "Kitchen exhaust hood running after closing",
    category: "Energy",
    description: "Heavy grease exhaust blower left running overnight after 10 PM stall closure.",
    zone: "food-court",
    zone_name: "Big Mingos Food Court",
    status: "Resolved",
    assignee: "Night Watchman",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 94).toISOString(),
      },
    ],
  },
  {
    id: 920,
    title: "Concrete lab curing tank water recycling valve",
    category: "Water",
    description: "Water from test tank draining directly into stormwater gully instead of sediment recycle pit.",
    zone: "civil",
    zone_name: "Civil Department",
    status: "Verified",
    assignee: "Civil Lab Technician",
    mine: false,
    author: "Campus Member #29",
    created_at: new Date(Date.now() - 3600000 * 93).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 93).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 91).toISOString(),
      },
    ],
  },
  {
    id: 921,
    title: "Crushed concrete core aggregate reuse",
    category: "Waste",
    description: "Test cylinders accumulated behind structural bay require crushing for road sub-base reuse.",
    zone: "civil",
    zone_name: "Civil Department",
    status: "Pending",
    assignee: "",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 90).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 90).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 88).toISOString(),
      },
    ],
  },
  {
    id: 922,
    title: "Bio-swale drainage gravel silt accumulation",
    category: "Green spaces",
    description: "Runoff silt washed into retention swale after monsoon shower, impeding water percolation.",
    zone: "civil",
    zone_name: "Civil Department",
    status: "Assigned",
    assignee: "Civil Green Committee",
    mine: false,
    author: "Campus Member #31",
    created_at: new Date(Date.now() - 3600000 * 87).toISOString(),
    image: DEMO_IMG_GARDEN,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 87).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 85).toISOString(),
      },
    ],
  },
  {
    id: 923,
    title: "Compressed air line acoustic leak",
    category: "Energy",
    description: "High-pitch hiss detected on 6 bar pneumatic line behind CNC machine station 2.",
    zone: "osm-133001682",
    zone_name: "Mechanical PG Labs",
    status: "Verified",
    assignee: "Workshop Supervisor",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 84).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 84).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 82).toISOString(),
      },
    ],
  },
  {
    id: 924,
    title: "Scrap aluminium swarf segregation bin",
    category: "Waste",
    description: "Machining swarf mixed with general oily rags in bin; separate bin labeling requested.",
    zone: "osm-133001682",
    zone_name: "Mechanical PG Labs",
    status: "In Progress",
    assignee: "Safety Officer",
    mine: false,
    author: "Campus Member #33",
    created_at: new Date(Date.now() - 3600000 * 81).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 81).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 79).toISOString(),
      },
    ],
  },
  {
    id: 925,
    title: "Diesel generator standby test fuel consumption",
    category: "Carbon",
    description: "Weekly test run logging discrepancy; fuel consumption higher than nominal load curve.",
    zone: "osm-133001682",
    zone_name: "Mechanical PG Labs",
    status: "Assigned",
    assignee: "Power House Team",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 78).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 78).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 76).toISOString(),
      },
    ],
  },
  {
    id: 926,
    title: "Soldering station solder sponge disposal",
    category: "Waste",
    description: "Lead-free solder dross and contaminated sponges require hazardous container pickup.",
    zone: "ece",
    zone_name: "Electronics and Communication",
    status: "Verified",
    assignee: "ECE Lab Assistant",
    mine: false,
    author: "Campus Member #35",
    created_at: new Date(Date.now() - 3600000 * 75).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 75).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 73).toISOString(),
      },
    ],
  },
  {
    id: 927,
    title: "High-frequency spectrum analyzer left on standby",
    category: "Energy",
    description: "Laboratory 202 testing bench instruments left on standby over weekend.",
    zone: "ece",
    zone_name: "Electronics and Communication",
    status: "Resolved",
    assignee: "Department Coordinator",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 70).toISOString(),
      },
    ],
  },
  {
    id: 928,
    title: "Restroom 2F push-tap stuck open",
    category: "Water",
    description: "Metering valve stuck in open position causing non-stop flush flow in west wing washroom.",
    zone: "ece",
    zone_name: "Electronics and Communication",
    status: "In Progress",
    assignee: "Plumbing Staff",
    mine: false,
    author: "Campus Member #37",
    created_at: new Date(Date.now() - 3600000 * 69).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 69).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 67).toISOString(),
      },
    ],
  },
  {
    id: 929,
    title: "Solar Substation 2 inverter fault code E-04",
    category: "Energy",
    description: "String inverter 3 displaying DC isolation fault; 15 kWp rooftop sub-array disconnected.",
    zone: "eee",
    zone_name: "Electrical and Electronics Department",
    status: "Verified",
    assignee: "Electrical Maintenance",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 66).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 66).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 64).toISOString(),
      },
    ],
  },
  {
    id: 930,
    title: "Power factor correction bank capacitor inspection",
    category: "Carbon",
    description: "APFC capacitor bank hunting; current PF 0.89 vs campus target 0.98 lagging.",
    zone: "eee",
    zone_name: "Electrical and Electronics Department",
    status: "Assigned",
    assignee: "Chief Electrical Engineer",
    mine: false,
    author: "Campus Member #39",
    created_at: new Date(Date.now() - 3600000 * 63).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 63).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 61).toISOString(),
      },
    ],
  },
  {
    id: 931,
    title: "Replaced battery electrolyte spill kit check",
    category: "Waste",
    description: "Battery room acid neutralizer kit missing protective gloves and litmus strips.",
    zone: "eee",
    zone_name: "Electrical and Electronics Department",
    status: "Verified",
    assignee: "Lab Safety Officer",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 58).toISOString(),
      },
    ],
  },
  {
    id: 932,
    title: "Corridor passive infrared sensor misaligned",
    category: "Energy",
    description: "Motion sensor at AIML 2F stairs fails to switch off lights when hallway is unoccupied.",
    zone: "ai-mca",
    zone_name: "AIML BLOCK",
    status: "Verified",
    assignee: "Electrical Team",
    mine: false,
    author: "Campus Member #41",
    created_at: new Date(Date.now() - 3600000 * 57).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 57).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 55).toISOString(),
      },
    ],
  },
  {
    id: 933,
    title: "Excess paper handout discarded after symposium",
    category: "Waste",
    description: "Printed conference brochures and flyers left in seminar hall instead of paper recycling bin.",
    zone: "ai-mca",
    zone_name: "AIML BLOCK",
    status: "Resolved",
    assignee: "Department Volunteer",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 54).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 54).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
      },
    ],
  },
  {
    id: 934,
    title: "GPU compute workstation cluster scheduling",
    category: "Carbon",
    description: "Cloud training batch jobs scheduled during daytime peak tariff instead of night off-peak.",
    zone: "ai-mca",
    zone_name: "AIML BLOCK",
    status: "Pending",
    assignee: "",
    mine: false,
    author: "Campus Member #43",
    created_at: new Date(Date.now() - 3600000 * 51).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 51).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 49).toISOString(),
      },
    ],
  },
  {
    id: 935,
    title: "Wind tunnel settling chamber fan unisolated",
    category: "Energy",
    description: "Auxiliary variable-frequency drive drawing 1.2 kW idle standby power.",
    zone: "ase-ise",
    zone_name: "Aerospace and Information Science",
    status: "Verified",
    assignee: "Aerospace Technician",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 46).toISOString(),
      },
    ],
  },
  {
    id: 936,
    title: "Carbon fiber scrap containment box",
    category: "Waste",
    description: "Pre-preg carbon fiber offcuts stored in unsealed cardboard box.",
    zone: "ase-ise",
    zone_name: "Aerospace and Information Science",
    status: "Assigned",
    assignee: "Composite Lab In-charge",
    mine: false,
    author: "Campus Member #45",
    created_at: new Date(Date.now() - 3600000 * 45).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 45).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 43).toISOString(),
      },
    ],
  },
  {
    id: 937,
    title: "Rainwater harvesting downspout dislodged",
    category: "Water",
    description: "Roof gutter downspout disconnected at joint, splashing onto pedestrian pathway.",
    zone: "ase-ise",
    zone_name: "Aerospace and Information Science",
    status: "In Progress",
    assignee: "Estate Maintenance",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
      },
    ],
  },
  {
    id: 938,
    title: "Solar hot water collector glass calcium scaling",
    category: "Water",
    description: "Hard water mineral deposits coating solar thermal evacuated tubes, reducing water heating.",
    zone: "osm-581289525",
    zone_name: "Cauvery Block Hostel",
    status: "Verified",
    assignee: "Hostel Warden",
    mine: false,
    author: "Campus Member #47",
    created_at: new Date(Date.now() - 3600000 * 39).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 39).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 37).toISOString(),
      },
    ],
  },
  {
    id: 939,
    title: "Hostel corridor lighting timer offset",
    category: "Energy",
    description: "Timer switch 40 minutes ahead of sunset, switching corridor lights on in broad daylight.",
    zone: "osm-581289525",
    zone_name: "Cauvery Block Hostel",
    status: "Resolved",
    assignee: "Hostel Electrician",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 34).toISOString(),
      },
    ],
  },
  {
    id: 940,
    title: "Delivery food plastic packaging in laundry area",
    category: "Waste",
    description: "Polystyrene food containers accumulating in laundry room collection hamper.",
    zone: "osm-581289525",
    zone_name: "Cauvery Block Hostel",
    status: "In Progress",
    assignee: "Hostel Committee",
    mine: false,
    author: "Campus Member #49",
    created_at: new Date(Date.now() - 3600000 * 33).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 33).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 31).toISOString(),
      },
    ],
  },
  {
    id: 941,
    title: "Overhead water tank float switch chatter",
    category: "Water",
    description: "Float valve contact bouncing causing booster pump to cycle every 90 seconds.",
    zone: "osm-133052565",
    zone_name: "Chamundi Hostel",
    status: "Verified",
    assignee: "Water Supply Team",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      },
    ],
  },
  {
    id: 942,
    title: "Old textbook and notebook collection drive",
    category: "Waste",
    description: "End-of-semester paper recycling box full in common study room.",
    zone: "osm-133052565",
    zone_name: "Chamundi Hostel",
    status: "Resolved",
    assignee: "Student Volunteer",
    mine: false,
    author: "Campus Member #51",
    created_at: new Date(Date.now() - 3600000 * 27).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 27).toISOString(),
      },
      {
        status: "Resolved",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 25).toISOString(),
      },
    ],
  },
  {
    id: 943,
    title: "Hostel courtyard neem sapling watering basin",
    category: "Green spaces",
    description: "Dry leaf litter choking water infiltration ring around young neem tree.",
    zone: "osm-133052565",
    zone_name: "Chamundi Hostel",
    status: "Pending",
    assignee: "",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    image: DEMO_IMG_GARDEN,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
      },
    ],
  },
  {
    id: 944,
    title: "High-mast stadium floodlight timer override",
    category: "Energy",
    description: "Two 400W LED floodlights manually switched on during morning jog hours.",
    zone: "osm-1327820775",
    zone_name: "Gymnatorium & Sports Ground",
    status: "Verified",
    assignee: "Physical Education Dept",
    mine: false,
    author: "Campus Member #53",
    created_at: new Date(Date.now() - 3600000 * 21).toISOString(),
    image: DEMO_IMG_ENERGY,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 21).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 19).toISOString(),
      },
    ],
  },
  {
    id: 945,
    title: "Perimeter sports ground sprinkler head leak",
    category: "Water",
    description: "Brass impact sprinkler leaking from swivel joint, pooling water on running track.",
    zone: "osm-1327820775",
    zone_name: "Gymnatorium & Sports Ground",
    status: "In Progress",
    assignee: "Grounds Crew",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    image: DEMO_IMG_WATER,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
      },
    ],
  },
  {
    id: 946,
    title: "Plastic water bottle disposal near basketball court",
    category: "Waste",
    description: "Recycling bin requested near spectator bleachers to collect discarded sports drink bottles.",
    zone: "osm-1327820775",
    zone_name: "Gymnatorium & Sports Ground",
    status: "Assigned",
    assignee: "Sports Secretary",
    mine: false,
    author: "Campus Member #55",
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    image: DEMO_IMG_WASTE,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
      {
        status: "Assigned",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 13).toISOString(),
      },
    ],
  },
  {
    id: 947,
    title: "EV campus shuttle charging cable trip hazard",
    category: "Transport",
    description: "Type 2 charging cable trailing across walkway without protective rubber cable ramp.",
    zone: "parking",
    zone_name: "Gate 1 Transit Hub",
    status: "Verified",
    assignee: "Transport Supervisor",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    image: DEMO_IMG_PARKING,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
    ],
  },
  {
    id: 948,
    title: "Student commuter carpool designated parking",
    category: "Carbon",
    description: "Lack of priority parking bays for high-occupancy 4+ carpooling student vehicles.",
    zone: "parking",
    zone_name: "Gate 1 Transit Hub",
    status: "Pending",
    assignee: "",
    mine: false,
    author: "Campus Member #57",
    created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
      {
        status: "Pending",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
      },
    ],
  },
  {
    id: 949,
    title: "Medicinal garden drip irrigation tube puncture",
    category: "Green spaces",
    description: "Perforated poly-tube spraying water 2 meters into air instead of root zone emitters.",
    zone: "garden",
    zone_name: "Pilot green space",
    status: "In Progress",
    assignee: "Horticulture Staff",
    mine: true,
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    image: DEMO_IMG_GARDEN,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        status: "In Progress",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
  {
    id: 950,
    title: "Composting leaf litter mulch bed moisture low",
    category: "Carbon",
    description: "Aerobic windrow composting pile dry; needs turning and moisture adjustment for carbon sequestration.",
    zone: "garden",
    zone_name: "Pilot green space",
    status: "Verified",
    assignee: "Sustainability Club",
    mine: false,
    author: "Campus Member #59",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    image: DEMO_IMG_CARBON,
    history: [
      {
        status: "Pending",
        note: "Submitted for campus review.",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        status: "Verified",
        note: "Status updated in campus review workflow.",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
  },
];

export function getDemoReportsBatch(existingReports: Report[], batchSize = 10): Report[] {
  const existingIds = new Set(existingReports.map((r) => r.id));
  const candidateList = DEMO_REPORTS_50.filter((r) => !existingIds.has(r.id));
  return candidateList.slice(0, batchSize);
}

export function getAll50DemoReports(): Report[] {
  return [...DEMO_REPORTS_50];
}
