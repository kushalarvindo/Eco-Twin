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
} from "lucide-react";
import type { User, Report } from "./types";

// High-fidelity SVG Data URIs for realistic campus field issue evidence
const DEMO_IMG_WATER =
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
  <!-- Pavement Grid -->
  <path d="M0 210 L500 210 M0 245 L500 245 M0 280 L500 280 M0 315 L500 315" stroke="#374c3e" stroke-width="1.5" stroke-dasharray="6 4"/>
  <path d="M90 200 L60 330 M180 200 L160 330 M280 200 L270 330 M370 200 L380 330 M450 200 L470 330" stroke="#374c3e" stroke-width="1.5"/>
  <!-- Wall base & skirting -->
  <rect x="0" y="0" width="500" height="200" fill="#223328"/>
  <rect x="0" y="190" width="500" height="15" fill="#1b2820"/>
  <!-- Water Pipe & Spigot -->
  <rect x="195" y="40" width="22" height="130" fill="url(#pipe)" rx="3"/>
  <path d="M190 70 L222 70 M190 120 L222 120" stroke="#775d1c" stroke-width="3"/>
  <path d="M217 140 h35 v35 h-20 v-15 h-15 z" fill="url(#pipe)"/>
  <!-- Tap Handle -->
  <rect x="235" y="125" width="30" height="8" rx="3" fill="#cf3b30"/>
  <circle cx="250" cy="129" r="3" fill="#ffffff"/>
  <!-- Water Spout & Drops -->
  <ellipse cx="242" cy="180" rx="8" ry="4" fill="#388bfd"/>
  <path d="M242 184 Q240 200 242 215 Q245 230 242 245" stroke="#58a6ff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="242" cy="225" r="3.5" fill="#79c0ff"/>
  <circle cx="243" cy="248" r="4" fill="#a5d6ff"/>
  <!-- Puddle on Ground -->
  <ellipse cx="245" cy="275" rx="130" ry="32" fill="url(#puddle)"/>
  <ellipse cx="270" cy="285" rx="60" ry="14" fill="#79c0ff" opacity="0.4"/>
  <!-- HUD Inspection Overlay -->
  <rect x="18" y="18" width="220" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#3fb950" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#f85149"/>
  <text x="48" y="36" fill="#7ee787" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • WATER</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">CSE Walkway Faucet • Leak Active</text>
  <!-- Reticle Crosshair -->
  <circle cx="242" cy="180" r="18" fill="none" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="242" y1="155" x2="242" y2="165" stroke="#58a6ff" stroke-width="1.5"/>
  <line x1="242" y1="195" x2="242" y2="205" stroke="#58a6ff" stroke-width="1.5"/>
  <line x1="217" y1="180" x2="227" y2="180" stroke="#58a6ff" stroke-width="1.5"/>
  <line x1="257" y1="180" x2="267" y2="180" stroke="#58a6ff" stroke-width="1.5"/>
</svg>
`);

const DEMO_IMG_WASTE =
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
  <!-- Food Court Patio -->
  <rect x="0" y="195" width="500" height="135" fill="#202c22"/>
  <path d="M0 220 H500 M0 255 H500 M0 290 H500" stroke="#314334" stroke-width="1.5"/>
  <!-- Food Court Signage -->
  <rect x="130" y="25" width="240" height="38" rx="6" fill="#1b281f" stroke="#487959" stroke-width="1.5"/>
  <text x="250" y="49" fill="#a3e635" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">MINGOS FOOD COURT • WASTE STATION</text>
  <!-- Three Segregation Bins -->
  <!-- Bin 1: Blue / Recyclables -->
  <rect x="95" y="120" width="80" height="120" rx="6" fill="#1d4ed8"/>
  <rect x="90" y="110" width="90" height="15" rx="3" fill="#2563eb"/>
  <text x="135" y="175" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">DRY</text>
  <text x="135" y="190" fill="#93c5fd" font-family="system-ui, sans-serif" font-size="8" text-anchor="middle">RECYCLE</text>
  <!-- Bin 2: Green / Wet Compost (Overflowing) -->
  <rect x="210" y="120" width="80" height="120" rx="6" fill="#15803d"/>
  <rect x="202" y="105" width="96" height="15" rx="3" fill="#16a34a" transform="rotate(-7 250 112)"/>
  <text x="250" y="175" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">WET</text>
  <text x="250" y="190" fill="#bbf7d0" font-family="system-ui, sans-serif" font-size="8" text-anchor="middle">ORGANIC</text>
  <!-- Overflowing waste items -->
  <rect x="220" y="80" width="34" height="22" rx="2" fill="#d97706" transform="rotate(12 237 91)"/>
  <rect x="245" y="72" width="28" height="28" rx="2" fill="#f59e0b" transform="rotate(-15 259 86)"/>
  <ellipse cx="235" cy="98" rx="14" ry="7" fill="#ffffff" opacity="0.8"/>
  <rect x="215" y="242" width="26" height="14" rx="2" fill="#d97706" transform="rotate(6 228 249)"/>
  <!-- Bin 3: Red / Hazardous -->
  <rect x="325" y="120" width="80" height="120" rx="6" fill="#b91c1c"/>
  <rect x="320" y="110" width="90" height="15" rx="3" fill="#dc2626"/>
  <text x="365" y="175" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">E-WASTE</text>
  <text x="365" y="190" fill="#fca5a5" font-family="system-ui, sans-serif" font-size="8" text-anchor="middle">SPECIAL</text>
  <!-- HUD Overlay -->
  <rect x="18" y="18" width="230" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#f59e0b" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#f59e0b"/>
  <text x="48" y="36" fill="#fcd34d" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • WASTE</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Food Court Bin 02 • Capacity Exceeded</text>
  <!-- Warning callout -->
  <circle cx="250" cy="85" r="22" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3"/>
</svg>
`);

const DEMO_IMG_ENERGY =
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
    <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="500" height="330" fill="url(#hall)"/>
  <!-- Perspective Corridor -->
  <polygon points="120,40 380,40 330,220 170,220" fill="#1c2820"/>
  <!-- Floor perspective -->
  <polygon points="170,220 330,220 500,330 0,330" fill="#243429"/>
  <!-- Corridor Window on Left Streaming Bright Sunlight -->
  <polygon points="20,70 100,85 100,195 20,210" fill="#67e8f9" opacity="0.6"/>
  <polygon points="20,70 100,85 240,280 60,330" fill="url(#sunbeam)"/>
  <!-- Blazing Ceiling Fluorescent Fixtures (Left ON during daytime) -->
  <rect x="180" y="55" width="140" height="12" rx="2" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
  <ellipse cx="250" cy="70" rx="90" ry="25" fill="url(#lampGlow)"/>
  <rect x="200" y="85" width="100" height="10" rx="2" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
  <ellipse cx="250" cy="98" rx="70" ry="20" fill="url(#lampGlow)"/>
  <rect x="220" y="115" width="60" height="8" rx="2" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
  <!-- Sunlight indicator icon (Sun outside window) -->
  <circle cx="55" cy="115" r="16" fill="#facc15" opacity="0.8"/>
  <text x="55" y="150" fill="#ffffff" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">DAYLIGHT PEAK</text>
  <!-- HUD Overlay -->
  <rect x="18" y="18" width="240" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#eab308" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#eab308"/>
  <text x="48" y="36" fill="#fde047" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • ENERGY AUDIT</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Admin Corridor 3F • Unattended Lighting</text>
</svg>
`);

const DEMO_IMG_GARDEN =
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
  <!-- Garden Soil & Grass -->
  <path d="M0 210 Q250 190 500 210 L500 330 L0 330 Z" fill="#2d4231"/>
  <ellipse cx="250" cy="270" rx="90" ry="24" fill="#3a2b1c"/>
  <!-- Young Sapling Stem & Canopy -->
  <path d="M250 270 Q248 180 250 110" stroke="#78350f" stroke-width="8" stroke-linecap="round" fill="none"/>
  <!-- Leaves / Foliage -->
  <circle cx="250" cy="95" r="32" fill="#22c55e" opacity="0.95"/>
  <circle cx="230" cy="85" r="24" fill="#4ade80" opacity="0.9"/>
  <circle cx="270" cy="88" r="26" fill="#16a34a" opacity="0.9"/>
  <circle cx="250" cy="65" r="22" fill="#86efac" opacity="0.9"/>
  <!-- Tilted Bamboo Protective Mesh Cage (Damaged/Leaning) -->
  <g transform="rotate(-22 250 260)">
    <line x1="215" y1="260" x2="215" y2="120" stroke="#ca8a04" stroke-width="4"/>
    <line x1="240" y1="260" x2="240" y2="115" stroke="#ca8a04" stroke-width="4"/>
    <line x1="265" y1="260" x2="265" y2="115" stroke="#ca8a04" stroke-width="4"/>
    <line x1="285" y1="260" x2="285" y2="120" stroke="#ca8a04" stroke-width="4"/>
    <!-- Horizontal Rings -->
    <ellipse cx="250" cy="135" rx="36" ry="8" fill="none" stroke="#eab308" stroke-width="2.5"/>
    <ellipse cx="250" cy="180" rx="38" ry="8" fill="none" stroke="#eab308" stroke-width="2.5"/>
    <ellipse cx="250" cy="225" rx="40" ry="8" fill="none" stroke="#eab308" stroke-width="2.5"/>
  </g>
  <!-- HUD Overlay -->
  <rect x="18" y="18" width="245" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#4ade80" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#4ade80"/>
  <text x="48" y="36" fill="#86efac" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • GREEN SPACES</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Botanical Garden • Sapling Guard Tilted</text>
</svg>
`);

const DEMO_IMG_PARKING =
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
  <!-- Roadway & Walkway -->
  <rect x="0" y="170" width="500" height="160" fill="#1b241c"/>
  <line x1="0" y1="210" x2="500" y2="210" stroke="#facc15" stroke-width="3" stroke-dasharray="14 10"/>
  <!-- Zebra Crossing -->
  <path d="M40 250 L120 250 M160 250 L240 250 M280 250 L360 250 M400 250 L480 250" stroke="#ffffff" stroke-width="12" opacity="0.75"/>
  <!-- Gate 1 Arch in background -->
  <rect x="140" y="30" width="220" height="85" fill="#2d3d31" rx="4"/>
  <rect x="180" y="60" width="140" height="55" fill="#141d17" rx="30 30 0 0"/>
  <text x="250" y="50" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">RVCE MAIN ENTRANCE • GATE 1</text>
  <!-- Bicycle Parking Racks (Inverted U Racks) -->
  <path d="M90 200 V140 Q110 120 130 140 V200" fill="none" stroke="#94a3b8" stroke-width="5"/>
  <path d="M170 200 V140 Q190 120 210 140 V200" fill="none" stroke="#94a3b8" stroke-width="5"/>
  <path d="M250 200 V140 Q270 120 290 140 V200" fill="none" stroke="#94a3b8" stroke-width="5"/>
  <!-- Bicycle Silhouettes Spilling Over -->
  <circle cx="100" cy="185" r="18" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="145" cy="185" r="18" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <line x1="100" y1="185" x2="125" y2="160" stroke="#38bdf8" stroke-width="3"/>
  <line x1="145" y1="185" x2="125" y2="160" stroke="#38bdf8" stroke-width="3"/>
  <!-- Overcrowding / Obstructing Bicycle -->
  <circle cx="280" cy="195" r="18" fill="none" stroke="#f43f5e" stroke-width="3"/>
  <circle cx="325" cy="195" r="18" fill="none" stroke="#f43f5e" stroke-width="3"/>
  <line x1="280" y1="195" x2="305" y2="170" stroke="#f43f5e" stroke-width="3"/>
  <line x1="325" y1="195" x2="305" y2="170" stroke="#f43f5e" stroke-width="3"/>
  <!-- Pedestrian Obstruction Callout -->
  <rect x="290" y="225" width="130" height="24" rx="4" fill="#e11d48"/>
  <text x="355" y="241" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">WALKWAY OBSTRUCTED</text>
  <!-- HUD Overlay -->
  <rect x="18" y="18" width="240" height="48" rx="6" fill="#000000" fill-opacity="0.65" stroke="#38bdf8" stroke-width="1"/>
  <circle cx="34" cy="42" r="5" fill="#38bdf8"/>
  <text x="48" y="36" fill="#7dd3fc" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CAMPUS EVIDENCE • MOBILITY</text>
  <text x="48" y="52" fill="#e6edf3" font-family="system-ui, sans-serif" font-size="11">Gate 1 Rack • Capacity Overcrowding</text>
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
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    image: DEMO_IMG_WATER,
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
    image: DEMO_IMG_WASTE,
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
    image: DEMO_IMG_ENERGY,
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
    image: DEMO_IMG_GARDEN,
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
    author: "Kushal (Student)",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    image: DEMO_IMG_PARKING,
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
      notify("Active Client: Kushal (Student Member)");
    } else if (role === "moderator") {
      setUser(DEMO_CLIENT_MODERATOR);
      notify("Active Client: Dr. Shashikiran (Faculty Reviewer)");
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
