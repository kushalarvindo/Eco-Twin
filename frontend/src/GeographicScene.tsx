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
import { campusInfrastructure, type InfrastructureAsset } from "./campus-features";
type Feature = (typeof data.buildings)[number];
function Diagnostics() {
  const frames = useRef(0);
  useFrame(({ gl }) => {
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
function Footprint({
  metric,
  p,
  selected,
  onSelect,
  green,
  report,
  onReport,
  scenarioReduction,
}: {
  metric?: { color: string; label: string };
  p: Feature;
  selected: string;
  onSelect: (s: string) => void;
  green: boolean;
  report?: Report;
  onReport: (r: Report) => void;
  scenarioReduction?: number | null;
}) {
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
          position={[p.centroid[0], p.height_units + 3, p.centroid[1]]}
        />
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
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          if (e.delta > 5) return;
          e.stopPropagation();
          onSelect(p.id);
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
          <meshBasicMaterial color={metric.color} />
        ) : (
          <meshStandardMaterial
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
        geometry={roof}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, p.height_units + 0.16, 0]}
        receiveShadow
      >
        {metric ? (
          <meshBasicMaterial color={metric.color} side={THREE.DoubleSide} />
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
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, p.height_units + 0.17, 0]}
      >
        <edgesGeometry args={[roof]} />
        <lineBasicMaterial color={active ? "#3e6d38" : "#bac4b2"} />
      </lineSegments>
      {active && (
        <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#355e2f" />
        </lineSegments>
      )}
      {report && (
        <mesh
          position={[p.centroid[0], p.height_units + 1, p.centroid[1]]}
          onClick={(e) => {
            e.stopPropagation();
            onReport(report);
          }}
          castShadow
        >
          <sphereGeometry args={[0.55, 16, 12]} />
          <meshStandardMaterial
            color="#c27329"
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
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
    const serviceGeom = serviceChunks.length ? mergeGeometries(serviceChunks) : null;
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

function WalkRouteLine({
  route,
}: {
  route?: { from: { centroid: number[] }; to: { centroid: number[] } } | null;
}) {
  const lineObj = useMemo(() => {
    if (!route) return null;
    const p1 = new THREE.Vector3(
      route.from.centroid[0],
      0.35,
      route.from.centroid[1],
    );
    const p2 = new THREE.Vector3(
      route.to.centroid[0],
      0.35,
      route.to.centroid[1],
    );
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
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
function Windows() {
  const windows = useMemo(() => {
    const transforms: THREE.Matrix4[] = [];
    const obj = new THREE.Object3D();
    for (const p of data.buildings) {
      if (p.tags.building === "construction") continue;
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
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    windows.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [windows]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, windows.length]}>
      <boxGeometry args={[0.22, 0.24, 0.04]} />
      <meshStandardMaterial
        color="#466575"
        roughness={0.16}
        metalness={0.82}
      />
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
          color={display.dark ? "#162217" : "#e2ebe0"}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      {/* Campus Boundary Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} receiveShadow>
        <meshStandardMaterial
          color={display.dark ? "#1c291d" : "#dde6cf"}
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
            color={display.dark ? "#243b24" : "#94b777"}
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
                i % 3 === 0
                  ? "#3f6a36"
                  : i % 3 === 1
                    ? "#4a783e"
                    : "#558847"
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
                i % 3 === 0
                  ? "#4e7d43"
                  : i % 3 === 1
                    ? "#58884c"
                    : "#639854"
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
  walkRoute?: { from: { centroid: number[] }; to: { centroid: number[] } } | null;
  onSelectAsset?: (asset: InfrastructureAsset) => void;
}) {
  const [lost, setLost] = useState(false);
  const display = usePreferences();
  if (lost)
    return (
      <div className="loading">
        3D graphics are unavailable. Select “2D map” to keep exploring.
      </div>
    );
  return (
    <Canvas
      shadows="soft"
      orthographic
      camera={{ position: [65, 65, 80], zoom: 8, near: 0.1, far: 450 }}
      frameloop="demand"
      dpr={display.quality === "low" ? 1 : [1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: display.dark ? 0.95 : 1.08,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(display.dark ? "#233029" : "#eaf0e9");
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
        args={[display.dark ? "#233029" : "#eaf0e9", 110, 340]}
      />
      <hemisphereLight
        color={display.dark ? "#2d4234" : "#f0f5ff"}
        groundColor={display.dark ? "#141c15" : "#cbd8c0"}
        intensity={display.dark ? 0.9 : 1.25}
      />
      <directionalLight
        position={[-42, 68, 38]}
        intensity={display.dark ? 1.8 : 2.3}
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
        intensity={display.dark ? 0.35 : 0.55}
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
          scenarioReduction={scenarioReduction}
          report={reports.find(
            (r) =>
              r.zone === p.id &&
              r.status !== "Rejected" &&
              r.status !== "Resolved",
          )}
          onReport={onReport}
        />
      ))}
      <Windows />
      <Camera command={command} />
    </Canvas>
  );
}
