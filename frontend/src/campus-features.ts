import data from "./campus-geographic.json";

export type Viewpoint = {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
};

export const campusViewpoints: Viewpoint[] = [
  {
    id: "overview",
    label: "Campus overview",
    position: [65, 65, 80],
    target: [0, 0, 0],
    zoom: 8,
  },
  {
    id: "admin",
    label: "Admin Quadrangle",
    position: [-10, 14, 16],
    target: [-22, 2, 2],
    zoom: 15,
  },
  {
    id: "cse",
    label: "CSE Block",
    position: [26, 14, -6],
    target: [16, 2, -17],
    zoom: 15,
  },
  {
    id: "library",
    label: "Central Library",
    position: [-12, 16, -8],
    target: [-4, 2, 2],
    zoom: 15,
  },
  {
    id: "food-court",
    label: "Food Court (MINGOS)",
    position: [36, 14, 25],
    target: [26, 2, 14],
    zoom: 15,
  },
  {
    id: "gate",
    label: "Mysuru Road Gate",
    position: [6, 12, -48],
    target: [0, 1, -30],
    zoom: 14,
  },
];

export type InfrastructureAsset = {
  id: string;
  name: string;
  fact_id: string;
  category: "Energy" | "Water" | "Waste";
  position: [number, number, number];
  centroid_2d: [number, number];
  capacity: string;
  description: string;
  source: string;
};

export const campusInfrastructure: InfrastructureAsset[] = [
  {
    id: "infra-solar",
    name: "500 kWp Solar PV Rooftop Array",
    fact_id: "F006",
    category: "Energy",
    position: [-22, 10.5, 2],
    centroid_2d: [-22, 2],
    capacity: "500 kWp rated capacity",
    description: "Rooftop solar photovoltaic array across campus academic buildings.",
    source: "RVCE Infrastructure (RVCE-010)",
  },
  {
    id: "infra-stp",
    name: "Sewage Treatment Plant (STP)",
    fact_id: "F007",
    category: "Water",
    position: [32, 1.2, 35],
    centroid_2d: [32, 35],
    capacity: "250 kL/day (RVCE-010) / 50 kL/day (RVCE-002)",
    description: "On-site wastewater treatment plant providing recycled water for campus landscaping.",
    source: "RVCE Infrastructure (RVCE-010) & Rainwater paper (RVCE-002)",
  },
  {
    id: "infra-rainwater",
    name: "Rainwater Harvesting & Recharge Wells",
    fact_id: "F009",
    category: "Water",
    position: [-6, 1.2, -12],
    centroid_2d: [-6, -12],
    capacity: "360,000 L storage + 2 recharge borewells",
    description: "Catchment storage tank and dedicated deep recharge borewells for aquifer replenishment.",
    source: "Rainwater Harvesting & Ground Water Recharging Study (RVCE-002)",
  },
  {
    id: "infra-samarthanam",
    name: "Solid Waste Segregation Station",
    fact_id: "F012",
    category: "Waste",
    position: [28, 1.2, 16],
    centroid_2d: [28, 16],
    capacity: "Campus canteens & academic blocks",
    description: "Dry and food waste collection and segregation partnering with Samarthanam NGO.",
    source: "RVCE Infrastructure (RVCE-010)",
  },
  {
    id: "infra-eparisara",
    name: "e-Parisara E-Waste Collection Hub",
    fact_id: "F011",
    category: "Waste",
    position: [18, 1.2, -15],
    centroid_2d: [18, -15],
    capacity: "Periodic institutional handover",
    description: "Safe recycling and formal disposal collection point for electronic waste.",
    source: "RVCE Infrastructure (RVCE-010)",
  },
];

export const buildingDirectory: Record<
  string,
  {
    departments: string[];
    floors: string[];
    facilities: string[];
    note: string;
  }
> = {
  admin: {
    departments: ["Administration", "Accounts & Admissions", "Placement & Training"],
    floors: [
      "Ground: Admissions, Enquiry & Accounts Office",
      "Floor 1: Principal Office, Registrar & Deans' Chambers",
      "Floor 2: Department of Placement & Career Training",
    ],
    facilities: ["Council Hall", "Board Room", "Visitor Reception"],
    note: "Official administrative headquarters and executive placement facility.",
  },
  cse: {
    departments: ["Computer Science & Engineering"],
    floors: [
      "Floor 1: Department Office, HOD Chamber & Faculty Rooms",
      "Floor 2: Systems Programming Lab & Cloud Computing Center",
      "Floor 3: Advanced Computing Lab, Project Labs & Seminar Hall",
    ],
    facilities: ["CSE Department Library", "Server Room", "Student Project Hub"],
    note: "Department directory referenced in RVCE-027.",
  },
  civil: {
    departments: ["Civil Engineering"],
    floors: [
      "Floor 1: Department Office & Structures Testing Facility",
      "Floor 2: Environmental Engineering & Geotechnical Labs",
      "Floor 3: Computer-Aided Design (CAD) & GIS Lab",
      "Floor 4: Seminar Hall & Research Scholar Cubicles",
    ],
    facilities: ["Hydraulics Laboratory", "Concrete Tech Testing", "Material Survey"],
    note: "Department directory referenced in RVCE-027.",
  },
  library: {
    departments: ["Central Library & Information Center"],
    floors: [
      "Ground: Circulation Desk, New Arrivals & Reference Section",
      "Floor 1: Digital Library, E-Resource Center & Periodicals",
      "Floor 2: Book Stacks & General Reading Hall",
      "Floor 3: Bound Journals, Archive Section & Research Carrels",
    ],
    facilities: ["Digital Library (Delnet/IEEE access)", "Audio-Visual Hall"],
    note: "Campus central library supporting all undergraduate and postgraduate programs.",
  },
  ece: {
    departments: ["Electronics & Communication Engineering"],
    floors: [
      "Floor 1: VLSI & Embedded Systems Research Labs",
      "Floor 2: Communication & Signal Processing Labs",
      "Floor 3: Department Office, HOD Chamber & Lecture Halls",
    ],
    facilities: ["Microwave Testing Lab", "Hardware Prototyping Workshop"],
    note: "Department directory referenced in RVCE-027.",
  },
  "ase-ise": {
    departments: ["Aerospace Engineering", "Information Science & Engineering"],
    floors: [
      "Floor 1: Information Science Labs & Department Office",
      "Floor 2: Network & Data Analytics Research Lab",
      "Floor 3: Aerospace Engineering, Avionics Lab & Flight Simulator",
    ],
    facilities: ["Aerodynamics Wind Tunnel Testing", "ISE Seminar Room"],
    note: "Joint block hosting Aerospace and Information Science departments.",
  },
  "ai-mca": {
    departments: ["Artificial Intelligence & ML", "Master of Computer Applications"],
    floors: [
      "Floor 1: AI/ML Department Office & Foundation Labs",
      "Floor 2: Deep Learning & Data Engineering Labs",
      "Floor 3: MCA Classrooms & Software Development Lab",
    ],
    facilities: ["High-Performance GPU Compute Server", "Incubation Corner"],
    note: "Newer academic facility housing AI/ML and MCA programs.",
  },
  eee: {
    departments: ["Electrical & Electronics Engineering"],
    floors: [
      "Floor 1: Electrical Machines Laboratory & Power Systems",
      "Floor 2: Control Systems Lab & Power Electronics",
      "Floor 3: Department Office & Classrooms",
    ],
    facilities: ["High Voltage Simulation Bench", "Renewable Energy Research Rig"],
    note: "Department directory referenced in RVCE-027.",
  },
  iem: {
    departments: ["Industrial Engineering & Management"],
    floors: [
      "Floor 1: Industrial Operations & Work Design Lab",
      "Floor 2: Manufacturing Simulation & Ergonomics Center",
      "Floor 3: Department Office & Seminar Room",
    ],
    facilities: ["Ergonomics Testing Suite", "Supply Chain Simulation Lab"],
    note: "Department directory referenced in RVCE-027.",
  },
  ete: {
    departments: ["Electronics & Telecommunication Engineering"],
    floors: [
      "Floor 1: Telecommunication Networks Lab",
      "Floor 2: Optical Fiber & Satellite Communication Lab",
      "Floor 3: Department Office & Classrooms",
      "Floor 4: Wireless Sensor Networks Research Suite",
    ],
    facilities: ["Antenna Measurements Lab", "RF Analysis Suite"],
    note: "Department directory referenced in RVCE-027.",
  },
  "food-court": {
    departments: ["Student Dining & Canteen"],
    floors: [
      "Ground: Indoor Food Hall, Beverage Counters & Seating (capacity ~1,000)",
    ],
    facilities: ["Samarthanam Waste Segregation Hub", "Drinking Water Stations"],
    note: "Primary student and faculty dining center (Big Mingos).",
  },
  "innovation-hub": {
    departments: ["Design Thinking & Innovation Hub"],
    floors: [
      "Floor 1: Interdisciplinary Prototyping Workshop",
      "Floor 2: Student Club Huddle Space & Entrepreneurship Cell",
    ],
    facilities: ["Maker Space", "3D Printing & Prototyping"],
    note: "Campus innovation huddle facility.",
  },
};

export function calculateWalkRoute(fromId: string, toId: string) {
  const fromBuilding = data.buildings.find((b) => b.id === fromId);
  const toBuilding = data.buildings.find((b) => b.id === toId);
  if (!fromBuilding || !toBuilding) return null;

  const [x1, z1] = fromBuilding.centroid;
  const [x2, z2] = toBuilding.centroid;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const euclideanUnits = Math.hypot(dx, dz);
  // Scale: 6 metres per scene unit, with a 1.25 circuity factor for campus walkways
  const straightMeters = Math.round(euclideanUnits * 6);
  const walkMeters = Math.round(straightMeters * 1.25);
  // 1.2 m/s standard campus walking speed
  const walkMinutes = Math.round((walkMeters / (1.2 * 60)) * 10) / 10;
  // ~0.05 kcal burned per metre of walking
  const calories = Math.round(walkMeters * 0.05);
  // ~140g CO2e per passenger-km for a two-wheeler/car trip
  const avoidedCarbonGrams = Math.round((walkMeters / 1000) * 140);

  return {
    from: fromBuilding,
    to: toBuilding,
    straightMeters,
    walkMeters,
    walkMinutes,
    calories,
    avoidedCarbonGrams,
  };
}

export type OfflineReport = {
  id: string;
  title: string;
  category: string;
  description: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
  image_data_url: string;
  image_name: string;
  created_at: string;
};

const OFFLINE_KEY = "ecotwin.offline_reports.v1";

export function getOfflineReports(): OfflineReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineReport(report: OfflineReport) {
  try {
    const list = getOfflineReports();
    list.unshift(report);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Could not save offline report", e);
  }
}

export function removeOfflineReport(id: string) {
  try {
    const list = getOfflineReports().filter((r) => r.id !== id);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Could not remove offline report", e);
  }
}

export function clearOfflineReports() {
  try {
    localStorage.removeItem(OFFLINE_KEY);
  } catch (e) {
    console.error("Could not clear offline reports", e);
  }
}
