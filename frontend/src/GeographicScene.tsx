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
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#15251e";
    ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 512, 64, 980);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      position={position}
      scale={[28, 3.5, 1]}
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
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.15, 0]}
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
                  : "#9fbd9f"
                : hover
                  ? "#dbc9a0"
                  : green
                    ? "#d6d8cf"
                    : p.id === "admin"
                      ? "#c8dbca"
                      : p.id === "cse"
                        ? "#ddc6b2"
                        : construction
                          ? "#d6c6b1"
                          : "#d6d2c2"
            }
            transparent={construction}
            opacity={construction ? 0.65 : 1}
          />
        )}
      </mesh>
      <mesh
        geometry={roof}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, p.height_units + 0.16, 0]}
      >
        {metric ? (
          <meshBasicMaterial color={metric.color} side={THREE.DoubleSide} />
        ) : (
          <meshStandardMaterial
            color={active ? "#d8e7c4" : construction ? "#b4aa93" : "#f0eddf"}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      {active && (
        <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#4f7c42" />
        </lineSegments>
      )}
      {report && (
        <mesh
          position={[p.centroid[0], p.height_units + 1, p.centroid[1]]}
          onClick={(e) => {
            e.stopPropagation();
            onReport(report);
          }}
        >
          <sphereGeometry args={[0.55, 12, 8]} />
          <meshBasicMaterial color="#a66c2d" />
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
        <mesh geometry={walkwaysGeom}>
          <meshStandardMaterial
            color={layer === "walkways" ? "#528c5e" : "#f5f0e1"}
          />
        </mesh>
      )}
      {serviceGeom && (
        <mesh geometry={serviceGeom}>
          <meshStandardMaterial
            color={layer === "walkways" ? "#ddd7c6" : "#f5f0e1"}
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
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.65, 14, 14]} />
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
            />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.07, 0.12, 0.4, 6]} />
            <meshBasicMaterial color="#303830" />
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
      <boxGeometry args={[0.22, 0.24, 0.035]} />
      <meshStandardMaterial color="#65867d" />
    </instancedMesh>
  );
}
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
  useEffect(
    () => () => {
      geom.dispose();
      greens.forEach((g) => g.geom.dispose());
    },
    [geom, greens],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom}>
        <meshStandardMaterial color="#dfe6d0" side={THREE.DoubleSide} />
      </mesh>
      {greens.map((g) => (
        <mesh
          key={g.id}
          geometry={g.geom}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.09, 0]}
        >
          <meshStandardMaterial color="#b8ce9d" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {data.trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1, 5]} />
            <meshStandardMaterial color="#a18662" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial color="#88a574" />
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
      maxZoom={25}
      maxPolarAngle={Math.PI / 2.25}
      enableDamping={false}
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
      orthographic
      camera={{ position: [65, 65, 80], zoom: 8, near: 0.1, far: 400 }}
      frameloop="demand"
      dpr={display.quality === "low" ? 1 : [1, 1.5]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#eaf0e9");
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => setLost(true),
          { once: true },
        );
      }}
    >
      <ScenePalette />
      <ambientLight intensity={display.dark ? 1.1 : 1.7} />
      <directionalLight position={[-30, 65, 30]} intensity={2.2} />
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
