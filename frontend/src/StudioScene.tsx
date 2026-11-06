import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useStudio } from "./CampusStudio";
import { inside, sunPosition, walkable, type MapPoint } from "./studio-math";
import campus from "./campus-geographic.json";
import type { Report } from "./types";
export function SceneLabel({
  text,
  point,
  onClick,
}: {
  text: string;
  point: MapPoint;
  onClick?: () => void;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = text.length < 5 ? 128 : 1024;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#152c23";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, 64, c.width - 24);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      position={point}
      scale={text.length < 5 ? [1.5, 1.5, 1] : [12, 1.5, 1]}
      renderOrder={300}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      <spriteMaterial map={texture} depthTest={false} depthWrite={false} />
    </sprite>
  );
}
export function SurfacePicker() {
  const studio = useStudio(),
    { gl, camera, scene, invalidate } = useThree();
  useEffect(() => {
    if (!studio || !["edit", "pin", "measure"].includes(studio.mode)) return;
    let start = [0, 0];
    const down = (e: PointerEvent) => {
      start = [e.clientX, e.clientY];
    };
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 5) return;
      const rect = gl.domElement.getBoundingClientRect(),
        ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      let hit: THREE.Intersection | undefined;
      for (const candidate of ray.intersectObjects(scene.children, true)) {
        let node: THREE.Object3D | null = candidate.object;
        while (node && !node.userData.proposalId) node = node.parent;
        if (node?.userData.proposalId && studio.mode === "edit") {
          studio.setChosen(node.userData.proposalId);
          return;
        }
        if (candidate.object.userData.campusSurface) {
          hit = candidate;
          break;
        }
      }
      if (!hit || !inside([hit.point.x, hit.point.z], campus.boundary)) {
        studio.setNotice("Choose a point inside the mapped campus.");
        return;
      }
      const p: MapPoint = [
        hit.point.x,
        Math.max(0.1, hit.point.y + 0.03),
        hit.point.z,
      ];
      if (studio.mode === "edit") {
        if (studio.objects.length >= 40) {
          studio.setNotice("This proposal already has 40 objects.");
          return;
        }
        const id = crypto.randomUUID();
        studio.setObjects((items) => [
          ...items,
          { id, kind: studio.kind, point: p, rotation: 0 },
        ]);
        studio.setChosen(id);
        studio.setNotice(
          "Object placed. Move the comparison divider to reveal it, or use the position fields.",
        );
      } else
        studio.setPoints((points) =>
          studio.mode === "pin" ? [p] : [...points, p].slice(0, 100),
        );
      invalidate();
    };
    gl.domElement.addEventListener("pointerdown", down);
    gl.domElement.addEventListener("pointerup", up);
    return () => {
      gl.domElement.removeEventListener("pointerdown", down);
      gl.domElement.removeEventListener("pointerup", up);
    };
  }, [studio, gl, camera, scene, invalidate]);
  return null;
}
function ProposalShape({ kind }: { kind: string }) {
  if (kind === "tree")
    return (
      <>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.8, 8]} />
          <meshStandardMaterial color="#75553e" />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow>
          <icosahedronGeometry args={[0.65, 1]} />
          <meshStandardMaterial color="#4f8b45" roughness={0.9} />
        </mesh>
      </>
    );
  if (kind === "solar")
    return (
      <group rotation={[0.22, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.08, 0.8]} />
          <meshStandardMaterial
            color="#234d75"
            metalness={0.35}
            roughness={0.4}
          />
        </mesh>
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]}>
            <boxGeometry args={[0.015, 0.01, 0.78]} />
            <meshStandardMaterial color="#bcced5" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "tank")
    return (
      <>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 1, 24]} />
          <meshStandardMaterial color="#4f8f9e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.03, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 24]} />
          <meshStandardMaterial color="#3a6670" />
        </mesh>
      </>
    );
  return (
    <>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.3, 0.22]} />
        <meshStandardMaterial color="#32805c" />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.26]} />
        <meshStandardMaterial color="#d6c65d" />
      </mesh>
    </>
  );
}
export function ProposalObjects() {
  const s = useStudio();
  if (!s || !["edit", "sun"].includes(s.mode)) return null;
  return (
    <group name="campus-proposals">
      {s.objects.map((o) => (
        <group
          key={o.id}
          position={o.point}
          rotation={[0, (o.rotation * Math.PI) / 180, 0]}
          onClick={(e) => {
            e.stopPropagation();
            s.setChosen(o.id);
          }}
        >
          <ProposalShape kind={o.kind} />
          {s.chosen === o.id && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <ringGeometry args={[0.65, 0.7, 32]} />
              <meshBasicMaterial color="#ffbd64" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
export function ComparisonRender() {
  const studio = useStudio()!;
  useFrame(({ gl, scene, camera, size }) => {
    const objects = scene.getObjectByName("campus-proposals");
    if (!objects) return;
    const width = size.width,
      height = size.height,
      split = (width * studio.split) / 100;
    gl.setScissorTest(true);
    objects.visible = false;
    gl.setScissor(0, 0, split, height);
    gl.render(scene, camera);
    objects.visible = true;
    gl.setScissor(split, 0, width - split, height);
    gl.render(scene, camera);
    gl.setScissorTest(false);
  }, 1);
  return null;
}
export function MeasurementObjects() {
  const s = useStudio();
  const points = s?.mode === "measure" ? s.points : [];
  const line = useMemo(() => {
    if (points.length < 2) return null;
    const positions =
      s?.areaMode && points.length > 2 ? [...points, points[0]] : points;
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        positions.map((p) => new THREE.Vector3(...p)),
      ),
      new THREE.LineBasicMaterial({ color: "#f37633", depthTest: false }),
    );
  }, [points, s?.areaMode]);
  useEffect(
    () => () => {
      line?.geometry.dispose();
      (line?.material as THREE.Material)?.dispose();
    },
    [line],
  );
  if (!s) return null;
  return (
    <>
      {line && <primitive object={line} />}
      {["measure", "pin"].includes(s.mode) &&
        s.points.map((p, i) => (
          <group key={i} position={p}>
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.18, 12, 8]} />
              <meshBasicMaterial
                color={s.mode === "pin" ? "#c83f37" : "#f37633"}
                depthTest={false}
              />
            </mesh>
            <SceneLabel
              text={s.mode === "pin" ? "New report pin" : String(i + 1)}
              point={[0, 1, 0]}
            />
          </group>
        ))}
    </>
  );
}
export function SunLight() {
  const s = useStudio()!,
    { invalidate, gl } = useThree(),
    sun = sunPosition(s.date, s.hour);
  useEffect(() => {
    gl.setClearColor(sun.altitude > 0 ? "#c8dce6" : "#111e2b");
    invalidate();
  }, [s.date, s.hour, gl, invalidate, sun.altitude]);
  return (
    <directionalLight
      position={sun.vector}
      intensity={sun.altitude > 0 ? 2.8 : 0}
      color="#ffefcd"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-85}
      shadow-camera-right={85}
      shadow-camera-top={85}
      shadow-camera-bottom={-85}
      shadow-camera-near={1}
      shadow-camera-far={260}
      shadow-normalBias={0.025}
    />
  );
}
export function WalkCamera({ selected }: { selected: string }) {
  const s = useStudio()!,
    { camera, invalidate, gl } = useThree();
  const pos = useRef(new THREE.Vector3(...s.position)),
    yaw = useRef(s.yaw),
    pitch = useRef(0),
    last = useRef(0);
  useEffect(() => {
    pos.current.set(...s.position);
    camera.position.copy(pos.current);
    invalidate();
  }, [selected]);
  useEffect(() => {
    gl.domElement.tabIndex = 0;
    gl.domElement.focus({ preventScroll: true });
    const ignored = (e: KeyboardEvent) =>
      /INPUT|TEXTAREA|SELECT|BUTTON/.test(
        (e.target as HTMLElement)?.tagName ?? "",
      );
    const down = (e: KeyboardEvent) => {
      if (ignored(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key)
      ) {
        e.preventDefault();
        s.keys.current.add(e.key);
        invalidate();
      }
      if (e.key === "Escape") {
        s.setMode("explore");
        s.keys.current.clear();
      }
    };
    const up = (e: KeyboardEvent) => s.keys.current.delete(e.key);
    let previous: number[] | null = null;
    const pointerDown = (e: PointerEvent) => {
      gl.domElement.focus({ preventScroll: true });
      previous = [e.clientX, e.clientY];
      gl.domElement.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e: PointerEvent) => {
      if (!previous) return;
      yaw.current -= (e.clientX - previous[0]) * 0.004;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - (e.clientY - previous[1]) * 0.004,
        -1.2,
        1.2,
      );
      previous = [e.clientX, e.clientY];
      invalidate();
    };
    const pointerUp = () => {
      previous = null;
    };
    const wake = () => invalidate(),
      blur = () => s.keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("campus-walk-input", wake);
    gl.domElement.addEventListener("pointerdown", pointerDown);
    gl.domElement.addEventListener("pointermove", pointerMove);
    gl.domElement.addEventListener("pointerup", pointerUp);
    gl.domElement.addEventListener("pointercancel", pointerUp);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("campus-walk-input", wake);
      gl.domElement.removeEventListener("pointerdown", pointerDown);
      gl.domElement.removeEventListener("pointermove", pointerMove);
      gl.domElement.removeEventListener("pointerup", pointerUp);
      gl.domElement.removeEventListener("pointercancel", pointerUp);
      s.keys.current.clear();
    };
  }, [camera, gl, invalidate, s.keys]);
  useFrame((state, delta) => {
    const k = s.keys.current,
      dt = Math.min(delta, 0.05);
    yaw.current +=
      ((k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0)) * dt * 1.4;
    const forward =
        (k.has("w") || k.has("ArrowUp") ? 1 : 0) -
        (k.has("s") || k.has("ArrowDown") ? 1 : 0),
      side = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0),
      len = Math.hypot(forward, side) || 1,
      speed = (1.6 / 6) * dt;
    const dx =
        ((-Math.sin(yaw.current) * forward + Math.cos(yaw.current) * side) /
          len) *
        speed,
      dz =
        ((-Math.cos(yaw.current) * forward - Math.sin(yaw.current) * side) /
          len) *
        speed;
    if (walkable(pos.current.x + dx, pos.current.z)) pos.current.x += dx;
    if (walkable(pos.current.x, pos.current.z + dz)) pos.current.z += dz;
    camera.position.copy(pos.current);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    if (state.clock.elapsedTime - last.current > 0.12) {
      s.setPosition(pos.current.toArray() as MapPoint);
      s.setYaw(yaw.current);
      last.current = state.clock.elapsedTime;
    }
    if (k.size) invalidate();
  });
  return (
    <PerspectiveCamera
      makeDefault
      fov={68}
      near={0.025}
      far={300}
      position={s.position}
    />
  );
}
export function ExactReportPins({
  reports,
  onReport,
}: {
  reports: Report[];
  onReport: (r: Report) => void;
}) {
  const [lon, lat] = campus.origin_lon_lat;
  return (
    <group>
      {reports
        .filter((r) => r.coordinates)
        .map((r) => {
          const p = r.coordinates!,
            x =
              ((p.longitude - lon) * 111320 * Math.cos((lat * Math.PI) / 180)) /
              6,
            z = ((lat - p.latitude) * 111320) / 6;
          return (
            <group
              key={r.id}
              position={[x, 0.3, z]}
              onClick={(e) => {
                e.stopPropagation();
                onReport(r);
              }}
            >
              <mesh>
                <coneGeometry args={[0.23, 0.65, 12]} />
                <meshBasicMaterial color="#bf3c37" />
              </mesh>
              <SceneLabel
                text={r.title}
                point={[0, 1, 0]}
                onClick={() => onReport(r)}
              />
            </group>
          );
        })}
    </group>
  );
}
export function PanoramaScene() {
  const s = useStudio()!,
    { invalidate, camera } = useThree(),
    pano = s.panoramas.find((p) => p.id === s.panorama);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    setTexture(null);
    if (!pano) return;
    let live = true;
    const loader = new THREE.TextureLoader();
    let map: THREE.Texture;
    map = loader.load(
      pano.url,
      (t) => {
        if (!live) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.repeat.x = -1;
        setTexture(t);
        invalidate();
      },
      undefined,
      () => s.setNotice("Panorama could not be loaded."),
    );
    return () => {
      live = false;
      map?.dispose();
    };
  }, [pano?.url, invalidate]);
  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={s.panoFov}
        near={0.01}
        far={220}
        position={[0, 0, 0.01]}
      />
      {texture && (
        <mesh>
          <sphereGeometry args={[100, 64, 32]} />
          <meshBasicMaterial
            map={texture}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      )}
      <OrbitControls
        target={[0, 0, 0]}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={-0.45}
        enableDamping={false}
        onChange={() => {
          const v = camera.getWorldDirection(new THREE.Vector3());
          s.look.current = {
            yaw: Math.atan2(-v.x, -v.z),
            pitch: Math.asin(v.y),
          };
        }}
      />
      {pano?.links.map((link, i) => {
        const to = s.panoramas.find((p) => p.id === link.target);
        return (
          to && (
            <SceneLabel
              key={i}
              text={"Go to " + to.name}
              point={[
                -Math.sin(link.yaw) * Math.cos(link.pitch) * 12,
                Math.sin(link.pitch) * 12,
                -Math.cos(link.yaw) * Math.cos(link.pitch) * 12,
              ]}
              onClick={() => s.setPanorama(to.id)}
            />
          )
        );
      })}
    </>
  );
}
export function LandmarkDetails() {
  const targets = campus.buildings.filter((b) =>
    ["admin", "cse", "library", "osm-133117221"].includes(b.id),
  );
  return (
    <>
      {targets.map((b) => {
        const edges = b.points
          .slice(1)
          .map((p, i) => ({
            a: b.points[i],
            b: p,
            length: Math.hypot(p[0] - b.points[i][0], p[1] - b.points[i][1]),
          }))
          .sort((a, b) => b.length - a.length);
        const edge = edges[0],
          cx = (edge.a[0] + edge.b[0]) / 2,
          cz = (edge.a[1] + edge.b[1]) / 2,
          angle = -Math.atan2(edge.b[1] - edge.a[1], edge.b[0] - edge.a[0]);
        return (
          <group key={b.id}>
            {b.id === "osm-133117221" && (
              <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
                {Array.from(
                  { length: Math.max(1, Math.round(b.height_m / 3.2)) },
                  (_, i) => (
                    <mesh
                      key={i}
                      position={[0, 0.3 + (i * 3.2) / 6, 0.06]}
                      castShadow
                    >
                      <boxGeometry args={[edge.length, 0.12, 0.2]} />
                      <meshStandardMaterial color="#bf9f83" />
                    </mesh>
                  ),
                )}
                <mesh position={[-edge.length * 0.2, b.height_units / 2, 0.16]}>
                  <boxGeometry args={[0.4, b.height_units, 0.05]} />
                  <meshStandardMaterial
                    color="#80b7c1"
                    metalness={0.3}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            )}
            {b.id === "admin" && (
              <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
                {Array.from(
                  { length: Math.max(2, Math.floor(edge.length / 0.7)) },
                  (_, i) => (
                    <mesh
                      key={i}
                      position={[
                        -edge.length / 2 + (i + 0.5) * 0.7,
                        b.height_units / 2,
                        0.06,
                      ]}
                      castShadow
                    >
                      <boxGeometry args={[0.08, b.height_units, 0.17]} />
                      <meshStandardMaterial color="#92a180" />
                    </mesh>
                  ),
                )}
                <mesh position={[0, 0.7, 0.32]} castShadow>
                  <boxGeometry args={[1.8, 0.09, 0.65]} />
                  <meshStandardMaterial color="#a4b194" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </>
  );
}
