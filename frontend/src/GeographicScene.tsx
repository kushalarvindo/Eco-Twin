import { useStudio } from "./CampusStudio";
import {
  SurfacePicker,
  ProposalObjects,
  ComparisonRender,
  MeasurementObjects,
  SunLight,
  WalkCamera,
  ExactReportPins,
  PanoramaScene,
  LandmarkDetails,
} from "./StudioScene";
import type { Hotspots } from "./hotspots";
import { usePreferences } from "./preferences";
import ScenePalette from "./ScenePalette";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as Controls } from "three-stdlib";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three";
import data from "./campus-geographic.json";
import type { Report } from "./types";
import {
  campusInfrastructure,
  type InfrastructureAsset,
} from "./campus-features";
type Feature = (typeof data.buildings)[number];
function Diagnostics() {
  const frames = useRef(0);
  useFrame(({ gl,camera }) => {
    gl.domElement.dataset.cameraPosition=JSON.stringify(camera.position.toArray());
    gl.domElement.dataset.cameraType=camera.type;
    gl.domElement.dataset.renderFrames = String(++frames.current);
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    gl.domElement.dataset.triangles = String(gl.info.render.triangles);
  });
  return null;
}
function shape(points: number[][]) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  return s;
}
function BuildingName({
  name,
  position,
}: {
  name: string;
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext("2d")!;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(14, 14, 996, 112, 56);
      ctx.fillStyle = "#152219f0";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#4d7a55";
      ctx.stroke();
    } else {
      ctx.fillStyle = "#152219f0";
      ctx.fillRect(14, 14, 996, 112);
    }
    ctx.fillStyle = "#f2f7ef";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 512, 70, 920);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      position={position}
      scale={[26, 3.4, 1]}
      renderOrder={100}
      raycast={() => {}}
    >
      <spriteMaterial map={texture} depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function IssuePinBadge({
  count,
  position,
  onClick,
}: {
  count: number;
  position: [number, number, number];
  onClick: (e: any) => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Gradient colors based on count:
  // 1-2: Warning amber / gold
  // 3-5: High activity vivid orange
  // 6+: Critical crimson red
  const { bgGradient, ringColor, emissiveColor } = useMemo(() => {
    if (count >= 6) {
      return {
        bgGradient: ["#dc2626", "#991b1b"],
        ringColor: "#ef4444",
        emissiveColor: "#b91c1c",
      };
    } else if (count >= 3) {
      return {
        bgGradient: ["#ea580c", "#c2410c"],
        ringColor: "#f97316",
        emissiveColor: "#c2410c",
      };
    } else {
      return {
        bgGradient: ["#eab308", "#ca8a04"],
        ringColor: "#fde047",
        emissiveColor: "#ca8a04",
      };
    }
  }, [count]);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, 256, 256);

    // Drop shadow for high-contrast visibility against any roof
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Outer white halo / ring
    ctx.beginPath();
    ctx.arc(128, 128, 98, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Gradient circle
    const grad = ctx.createLinearGradient(128, 30, 128, 226);
    grad.addColorStop(0, bgGradient[0]);
    grad.addColorStop(1, bgGradient[1]);
    ctx.beginPath();
    ctx.arc(128, 128, 86, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle inner stroke
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.stroke();

    // Center bold number
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = count > 99 ? 80 : count > 9 ? 94 : 110;
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(String(count), 128, 134);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [count, bgGradient]);

  useEffect(() => () => texture.dispose(), [texture]);

  const [x, y, z] = position;

  return (
    <group
      position={[x, y, z]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Roof surface contact ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.35, 0.65, 24]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={hovered ? 0.95 : 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sleek metallic pin stalk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.03, 1.8, 12]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Base collar bead */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={emissiveColor}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* 3D Billboard Number Badge */}
      <sprite
        position={[0, 2.7, 0]}
        scale={hovered ? [4.6, 4.6, 1] : [3.8, 3.8, 1]}
        renderOrder={250}
      >
        <spriteMaterial map={texture} depthTest={false} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Footprint({
  metric,
  p,
  selected,
  onSelect,
  green,
  reportsForZone = [],
  onReport,
  scenarioReduction,
  isHeatmap = false,
}: {
  metric?: { color: string; label: string };
  p: Feature;
  selected: string;
  onSelect: (s: string) => void;
  green: boolean;
  reportsForZone?: Report[];
  onReport: (r: Report) => void;
  scenarioReduction?: number | null;
  isHeatmap?: boolean;
}) {
  const studio = useStudio();
  const cut = studio?.mode === "cutaway" && p.id === selected;
  const level = Math.max(
    1,
    Math.min(studio?.floor ?? 1, Math.ceil((p.height_m - 0.01) / 3.2)),
  );
  const clip = useMemo(
    () =>
      cut
        ? [
            new THREE.Plane(
              new THREE.Vector3(0, -1, 0),
              (level * 3.2) / 6 + 0.15,
            ),
          ]
        : [],
    [cut, level],
  );
  const slab = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape(p.points), {
        depth: 0.035,
        bevelEnabled: false,
      }),
    [p],
  );
  useEffect(() => () => slab.dispose(), [slab]);
  const [hover, setHover] = useState(false);
  const active = p.id === selected;
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape(p.points), {
        depth: p.height_units,
        bevelEnabled: false,
      }),
    [p],
  );
  const roof = useMemo(() => new THREE.ShapeGeometry(shape(p.points)), [p]);
  useEffect(
    () => () => {
      geometry.dispose();
      roof.dispose();
    },
    [geometry, roof],
  );
  const construction = p.tags.building === "construction";
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      {(hover || active) && (
        <BuildingName
          name={metric ? p.name + " · " + metric.label : p.name}
          position={[
            p.centroid[0],
            cut ? (level * 3.2) / 6 + 1 : p.height_units + 3,
            p.centroid[1],
          ]}
        />
      )}
      {/* Heatmap ground thermal halo */}
      {isHeatmap && reportsForZone.length > 0 && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.centroid[0], 0.04, p.centroid[1]]}
        >
          <circleGeometry
            args={[4 + Math.min(reportsForZone.length * 1.5, 14), 32]}
          />
          <meshBasicMaterial
            color={
              reportsForZone.length >= 6
                ? "#dc2626"
                : reportsForZone.length >= 3
                  ? "#ea580c"
                  : "#eab308"
            }
            transparent
            opacity={0.32}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Ground contact shadow plinth */}
      <mesh
        geometry={roof}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        scale={[1.02, 1.02, 1]}
      >
        <meshBasicMaterial
          color="#000000"
          opacity={0.16}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* Extruded building structure */}
      <mesh
        userData={{ campusSurface: true }}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          if (e.delta > 5) return;
          e.stopPropagation();
          if (studio?.mode !== "walk") onSelect(p.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        {metric ? (
          <meshStandardMaterial
            clippingPlanes={clip}
            color={metric.color}
            emissive={
              isHeatmap && reportsForZone.length > 0
                ? reportsForZone.length >= 6
                  ? "#991b1b"
                  : reportsForZone.length >= 3
                    ? "#c2410c"
                    : "#ca8a04"
                : "#000000"
            }
            emissiveIntensity={
              isHeatmap && reportsForZone.length > 0 ? 0.35 : 0
            }
            roughness={0.65}
            metalness={0.08}
          />
        ) : (
          <meshStandardMaterial
            clippingPlanes={clip}
            color={
              active
                ? scenarioReduction
                  ? new THREE.Color("#b4c6a8").lerp(
                      new THREE.Color("#467442"),
                      scenarioReduction / 100,
                    )
                  : "#8db58d"
                : hover
                  ? "#d6c39a"
                  : green
                    ? "#d1d5c7"
                    : p.id === "admin"
                      ? "#c8d8c6"
                      : p.id === "cse"
                        ? "#dad0bf"
                        : construction
                          ? "#cfc4b0"
                          : "#d4d4cb"
            }
            roughness={0.72}
            metalness={0.06}
            transparent={construction}
            opacity={construction ? 0.65 : 1}
          />
        )}
      </mesh>
      {/* Building roof */}
      <mesh
        visible={!cut}
        userData={{ campusSurface: true }}
        geometry={roof}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, p.height_units + 0.16, 0]}
        receiveShadow
      >
        {metric ? (
          <meshStandardMaterial
            color={metric.color}
            emissive={
              isHeatmap && reportsForZone.length > 0
                ? reportsForZone.length >= 6
                  ? "#dc2626"
                  : reportsForZone.length >= 3
                    ? "#ea580c"
                    : "#eab308"
                : "#000000"
            }
            emissiveIntensity={
              isHeatmap && reportsForZone.length > 0 ? 0.25 : 0
            }
            roughness={0.52}
            metalness={0.12}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color={active ? "#cde0bc" : construction ? "#b0a58e" : "#ece9de"}
            roughness={0.52}
            metalness={0.12}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      {/* Architectural roof coping trim */}
      <lineSegments
        visible={!cut}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, p.height_units + 0.17, 0]}
      >
        <edgesGeometry args={[roof]} />
        <lineBasicMaterial color={active ? "#3e6d38" : "#bac4b2"} />
      </lineSegments>
      {cut &&
        Array.from({ length: level }, (_, i) => (
          <mesh
            key={i}
            geometry={slab}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.18 + (i * 3.2) / 6, 0]}
          >
            <meshStandardMaterial
              color={i === level - 1 ? "#e1bb78" : "#b2c7c2"}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      {active && (
        <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#355e2f" />
        </lineSegments>
      )}
      {reportsForZone.length > 0 && (
        <IssuePinBadge
          count={reportsForZone.length}
          position={[p.centroid[0], p.height_units + 0.16, p.centroid[1]]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(p.id);
            onReport(reportsForZone[0]);
          }}
        />
      )}
    </group>
  );
}
function Roads({ layer }: { layer?: string }) {
  const { walkwaysGeom, serviceGeom } = useMemo(() => {
    const walkChunks: THREE.BufferGeometry[] = [];
    const serviceChunks: THREE.BufferGeometry[] = [];
    for (const road of data.roads) {
      const isWalkway = ["footway", "pedestrian", "path", "steps"].includes(
        road.tags.highway || "",
      );
      const target = isWalkway ? walkChunks : serviceChunks;
      for (let i = 1; i < road.points.length; i++) {
        const [ax, az] = road.points[i - 1],
          [bx, bz] = road.points[i];
        const dx = bx - ax,
          dz = bz - az;
        const length = Math.hypot(dx, dz);
        if (!length) continue;
        const g = new THREE.BoxGeometry(length, 0.025, road.width_units);
        g.rotateY(-Math.atan2(dz, dx));
        g.translate((ax + bx) / 2, 0.12, (az + bz) / 2);
        target.push(g);
      }
    }
    const walkwaysGeom = walkChunks.length ? mergeGeometries(walkChunks) : null;
    const serviceGeom = serviceChunks.length
      ? mergeGeometries(serviceChunks)
      : null;
    walkChunks.forEach((g) => g.dispose());
    serviceChunks.forEach((g) => g.dispose());
    return { walkwaysGeom, serviceGeom };
  }, []);

  useEffect(
    () => () => {
      walkwaysGeom?.dispose();
      serviceGeom?.dispose();
    },
    [walkwaysGeom, serviceGeom],
  );

  return (
    <>
      {walkwaysGeom && (
        <mesh geometry={walkwaysGeom} receiveShadow>
          <meshStandardMaterial
            color={layer === "walkways" ? "#448151" : "#eae4d6"}
            roughness={0.78}
            metalness={0.04}
          />
        </mesh>
      )}
      {serviceGeom && (
        <mesh geometry={serviceGeom} receiveShadow>
          <meshStandardMaterial
            color={layer === "walkways" ? "#ccc4b2" : "#dfd8c8"}
            roughness={0.65}
            metalness={0.08}
          />
        </mesh>
      )}
    </>
  );
}

function WalkRouteLine({ route }: { route?: { points: number[][] } | null }) {
  const lineObj = useMemo(() => {
    if (!route) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(
      route.points.map(([x, z]) => new THREE.Vector3(x, 0.35, z)),
    );
    const mat = new THREE.LineBasicMaterial({
      color: 0x2d7742,
    });
    return new THREE.Line(geom, mat);
  }, [route]);

  useEffect(
    () => () => {
      lineObj?.geometry.dispose();
      (lineObj?.material as THREE.Material)?.dispose();
    },
    [lineObj],
  );

  if (!lineObj) return null;
  return <primitive object={lineObj} />;
}

function InfrastructurePins({
  onSelectAsset,
}: {
  onSelectAsset?: (asset: InfrastructureAsset) => void;
}) {
  return (
    <group>
      {campusInfrastructure.map((asset) => (
        <group
          key={asset.id}
          position={asset.position}
          onClick={(e) => {
            e.stopPropagation();
            onSelectAsset?.(asset);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          {/* Ground Contact Shadow */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 12]} />
            <meshBasicMaterial
              color="#000000"
              opacity={0.2}
              transparent
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <sphereGeometry args={[0.65, 16, 16]} />
            <meshStandardMaterial
              color={
                asset.category === "Energy"
                  ? "#d67c29"
                  : asset.category === "Water"
                    ? "#3577a3"
                    : "#358a52"
              }
              emissive={
                asset.category === "Energy"
                  ? "#784210"
                  : asset.category === "Water"
                    ? "#144566"
                    : "#154d2a"
              }
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 0.4, 8]} />
            <meshStandardMaterial
              color="#303830"
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
          <BuildingName name={asset.name} position={[0, 2.2, 0]} />
        </group>
      ))}
    </group>
  );
}
function Windows({ exclude }: { exclude?: string }) {
  const windows = useMemo(() => {
    const transforms: THREE.Matrix4[] = [];
    const obj = new THREE.Object3D();
    for (const p of data.buildings) {
      if (p.tags.building === "construction" || p.id === exclude) continue;
      const floors = Math.max(1, Math.min(6, Math.round(p.height_m / 3.2)));
      for (let e = 1; e < p.points.length; e++) {
        const [ax, az] = p.points[e - 1],
          [bx, bz] = p.points[e],
          dx = bx - ax,
          dz = bz - az,
          len = Math.hypot(dx, dz);
        if (len < 0.8) continue;
        const count = Math.floor(len / 0.65);
        for (let j = 1; j <= count; j++) {
          for (let floor = 0; floor < floors; floor++) {
            const t = j / (count + 1);
            obj.position.set(ax + dx * t, 0.45 + floor * 0.53, az + dz * t);
            obj.rotation.set(0, -Math.atan2(dz, dx), 0);
            obj.updateMatrix();
            transforms.push(obj.matrix.clone());
          }
        }
      }
    }
    return transforms;
  }, [exclude]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    windows.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [windows]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, windows.length]}>
      <boxGeometry args={[0.22, 0.24, 0.04]} />
      <meshStandardMaterial color="#466575" roughness={0.16} metalness={0.82} />
    </instancedMesh>
  );
}

const campusTrees: [number, number][] = [
  [7.24, -5.71],
  [22.01, -13.26],
  [5.69, -5.37],
  [-25.84, -24.03],
  [-13.5, -6.9],
  [-43.1, 7.6],
  [-46.7, 4.5],
  [-36.0, 16.8],
  [-12.0, 3.5],
  [-28.7, -15.0],
  [-25.7, -11.9],
  [-31.7, -18.1],
  [-38.3, -11.4],
  [-36.8, -9.8],
  [-39.9, -12.9],
  [-43.4, -6.2],
  [-13.9, -37.0],
  [-9.5, -32.8],
  [-18.4, -41.3],
  [8.7, 21.1],
  [11.1, 22.5],
  [6.4, 19.7],
];

function Ground() {
  const geom = useMemo(() => new THREE.ShapeGeometry(shape(data.boundary)), []);
  const greens = useMemo(
    () =>
      data.green.map((p) => ({
        id: p.id,
        geom: new THREE.ShapeGeometry(shape(p.points)),
      })),
    [],
  );
  const display = usePreferences();
  useEffect(
    () => () => {
      geom.dispose();
      greens.forEach((g) => g.geom.dispose());
    },
    [geom, greens],
  );
  return (
    <>
      {/* Expansive Horizon Ground Base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color={display.dark ? "#677b78" : "#e2ebe0"}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      {/* Campus Boundary Terrain */}
      <mesh
        userData={{ campusSurface: true }}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={geom}
        receiveShadow
      >
        <meshStandardMaterial
          color={display.dark ? "#81947e" : "#dde6cf"}
          roughness={0.9}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Green Quadrangles & Lawns */}
      {greens.map((g) => (
        <mesh
          key={g.id}
          geometry={g.geom}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.08, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color={display.dark ? "#719363" : "#94b777"}
            roughness={0.88}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Trees */}
      {campusTrees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Ground Contact Shadow */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.65, 12]} />
            <meshBasicMaterial
              color="#000000"
              opacity={0.14}
              transparent
              depthWrite={false}
            />
          </mesh>
          {/* Trunk */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.9, 6]} />
            <meshStandardMaterial
              color="#554435"
              roughness={0.92}
              metalness={0.04}
            />
          </mesh>
          {/* Lower Foliage Dome */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <dodecahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial
              color={
                i % 3 === 0 ? "#3f6a36" : i % 3 === 1 ? "#4a783e" : "#558847"
              }
              roughness={0.82}
              metalness={0.02}
            />
          </mesh>
          {/* Upper Sunlit Canopy Dome */}
          <mesh position={[0, 1.35, 0]} castShadow>
            <dodecahedronGeometry args={[0.42, 1]} />
            <meshStandardMaterial
              color={
                i % 3 === 0 ? "#4e7d43" : i % 3 === 1 ? "#58884c" : "#639854"
              }
              roughness={0.8}
              metalness={0.02}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
function Camera({
  command,
}: {
  command: {
    type: string;
    tick: number;
    position?: [number, number, number];
    target?: [number, number, number];
    zoom?: number;
  };
}) {
  const ref = useRef<Controls>(null);
  const { camera, size, invalidate, gl } = useThree();
  useEffect(() => {
    camera.zoom = Math.max(2.6, Math.min(10, size.width / 95));
    camera.updateProjectionMatrix();
    invalidate();
  }, [size.width, camera, invalidate]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (command.type === "viewpoint" && command.position && command.target) {
      camera.position.set(...command.position);
      c.target.set(...command.target);
      if (command.zoom) camera.zoom = command.zoom;
    } else if (command.type === "reset") {
      camera.position.set(65, 65, 80);
      camera.zoom = Math.max(2.6, Math.min(10, size.width / 95));
      c.target.set(0, 0, 0);
    } else if (command.type === "top") {
      camera.position.set(0, 110, 0.1);
      c.target.set(0, 0, 0);
    } else {
      camera.zoom = THREE.MathUtils.clamp(
        camera.zoom * (command.type === "in" ? 1.2 : 1 / 1.2),
        2,
        25,
      );
    }
    camera.updateProjectionMatrix();
    c.update();
    invalidate();
  }, [command, camera, invalidate, size.width]);
  useEffect(() => {
    gl.domElement.dataset.renderer = "threejs-geographic";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [gl]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      minZoom={2}
      maxZoom={30}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping={true}
      dampingFactor={0.06}
    />
  );
}
export default function GeographicScene({
  heat,
  selected,
  onSelect,
  layer,
  command,
  reports,
  onReport,
  scenarioReduction,
  walkRoute,
  onSelectAsset,
}: {
  selected: string;
  onSelect: (s: string) => void;
  layer: string;
  command: {
    type: string;
    tick: number;
    position?: [number, number, number];
    target?: [number, number, number];
    zoom?: number;
  };
  heat?: Hotspots;
  reports: Report[];
  onReport: (r: Report) => void;
  scenarioReduction?: number | null;
  walkRoute?: { points: number[][] } | null;
  onSelectAsset?: (asset: InfrastructureAsset) => void;
}) {
  const studio = useStudio();
  const [lost, setLost] = useState(false);
  const display = usePreferences();
  const reportsByZone = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      if (r.status !== "Rejected" && r.status !== "Resolved") {
        const list = map.get(r.zone) || [];
        list.push(r);
        map.set(r.zone, list);
      }
    }
    return map;
  }, [reports]);
  if (lost)
    return (
      <div className="loading">
        3D graphics are unavailable. Select “2D map” to keep exploring.
      </div>
    );
  if (
    studio?.mode === "panorama" &&
    studio.panoramas.some((p) => p.id === studio.panorama)
  )
    return (
      <Canvas key="panorama" frameloop="demand" dpr={[1, 1.5]}>
        <PanoramaScene />
      </Canvas>
    );
  return (
    <Canvas key="campus"
      shadows="soft"
      orthographic
      camera={{ position: [65, 65, 80], zoom: 8, near: 0.1, far: 450 }}
      frameloop="demand"
      dpr={display.quality === "low" ? 1 : [1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: display.dark ? 1.06 : 1.08,
      }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor(display.dark ? "#879d9d" : "#eaf0e9");
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => setLost(true),
          { once: true },
        );
      }}
    >
      <ScenePalette />
      <fog
        attach="fog"
        args={[display.dark ? "#879d9d" : "#eaf0e9", 110, 340]}
      />
      <hemisphereLight
        color={display.dark ? "#dce8fb" : "#f0f5ff"}
        groundColor={display.dark ? "#a6ae92" : "#cbd8c0"}
        intensity={studio?.mode === "sun" ? 0.22 : display.dark ? 1.5 : 1.25}
      />
      <directionalLight
        position={[-42, 68, 38]}
        intensity={studio?.mode === "sun" ? 0 : display.dark ? 1.8 : 2.3}
        color={display.dark ? "#d6e5d3" : "#fffcf2"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={240}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[45, 30, -35]}
        intensity={studio?.mode === "sun" ? 0 : display.dark ? 0.35 : 0.55}
        color="#c2d5e5"
      />
      <Diagnostics />
      <Ground />
      <Roads layer={layer} />
      <WalkRouteLine route={walkRoute} />
      {(layer === "infrastructure" || layer === "green") && (
        <InfrastructurePins onSelectAsset={onSelectAsset} />
      )}
      {data.buildings.map((p) => (
        <Footprint
          metric={heat?.byId.get(p.id)}
          key={p.osm_id}
          p={p}
          selected={selected}
          onSelect={onSelect}
          green={layer === "green"}
          isHeatmap={layer === "heatmap"}
          scenarioReduction={scenarioReduction}
          reportsForZone={reportsByZone.get(p.id) || []}
          onReport={onReport}
        />
      ))}
      <Windows exclude={studio?.mode === "cutaway" ? selected : undefined} />
      {studio?.mode !== "cutaway" && <LandmarkDetails />}
      <SurfacePicker />
      <ProposalObjects />
      <MeasurementObjects />
      <ExactReportPins reports={reports} onReport={onReport} />
      {studio?.mode === "edit" && studio.compare && <ComparisonRender />}
      {studio?.mode === "sun" && <SunLight />}
      {studio?.mode === "walk" ? (
        <WalkCamera selected={selected} />
      ) : (
        <Camera command={command} />
      )}
    </Canvas>
  );
}
