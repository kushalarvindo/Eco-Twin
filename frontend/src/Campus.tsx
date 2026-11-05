import { usePreferences } from "./preferences";
import ScenePalette from "./ScenePalette";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import layout from "./campus-layout.json";
export const places = layout.places;
const treePositions = Array.from({ length: 0 }, (_, i) => {
  const t = (i / 65) * Math.PI * 2;
  return [Math.cos(t) * 29 + ((i % 3) - 1) * 1.1, Math.sin(t) * 22];
});
function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null),
    crowns = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    treePositions.forEach(([x, z], i) => {
      o.position.set(x, 1, z);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      trunks.current!.setMatrixAt(i, o.matrix);
      o.position.y = 2.3;
      const s = 0.9 + (i % 4) * 0.16;
      o.scale.set(s, s * 1.3, s);
      o.updateMatrix();
      crowns.current!.setMatrixAt(i, o.matrix);
      crowns.current!.setColorAt(
        i,
        new THREE.Color(["#6e9870", "#89a97b", "#a1b58a", "#638969"][i % 4]),
      );
    });
    trunks.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, 65]}>
        <cylinderGeometry args={[0.14, 0.2, 1.8, 6]} />
        <meshStandardMaterial color="#9b8063" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, 65]}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </>
  );
}
function Building({
  p,
  selected,
  onSelect,
  layer,
}: {
  p: (typeof places)[number];
  selected: string;
  onSelect: (id: string) => void;
  layer: string;
}) {
  const [hover, setHover] = useState(false);
  const active = p.id === selected;
  return (
    <group position={[p.x, 0.25, p.z]}>
      <mesh
        position={[0, p.h / 2, 0]}
        onClick={(e) => {
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
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial
          color={
            active
              ? "#a7c6ac"
              : hover
                ? "#e5dbba"
                : layer === "green" && p.id !== "garden"
                  ? "#e0ded4"
                  : p.color
          }
          roughness={0.7}
          metalness={0.06}
        />
      </mesh>
      {active && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[p.w + 0.9, p.d + 0.9]} />
          <meshBasicMaterial color="#478c63" />
        </mesh>
      )}
      {p.h > 1 && (
        <>
          <mesh position={[0, p.h + 0.12, 0]} receiveShadow>
            <boxGeometry args={[p.w + 0.3, 0.25, p.d + 0.3]} />
            <meshStandardMaterial
              color="#f2efe5"
              roughness={0.52}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0, p.h + 0.28, 0]} receiveShadow>
            <boxGeometry args={[p.w - 1, 0.16, p.d - 1]} />
            <meshStandardMaterial
              color="#a6aaa0"
              roughness={0.6}
              metalness={0.15}
            />
          </mesh>
          {Array.from({ length: Math.floor(p.w / 1.3) }, (_, i) => (
            <mesh
              key={i}
              position={[-p.w / 2 + 1 + i * 1.3, p.h * 0.55, p.d / 2 + 0.02]}
            >
              <boxGeometry args={[0.6, 1.3, 0.05]} />
              <meshStandardMaterial
                color="#506f75"
                roughness={0.18}
                metalness={0.8}
              />
            </mesh>
          ))}
          {false &&
            Array.from({ length: 6 }, (_, i) => (
              <mesh
                key={i}
                position={[
                  -2 + (i % 3) * 2,
                  p.h + 0.6,
                  -1.5 + Math.floor(i / 3) * 2,
                ]}
                rotation={[-0.15, 0, 0]}
              >
                <boxGeometry args={[1.6, 0.1, 1.5]} />
                <meshStandardMaterial color="#496b84" />
              </mesh>
            ))}
        </>
      )}
      {p.id === "parking" &&
        Array.from({ length: 8 }, (_, i) => (
          <group
            key={i}
            position={[(i % 2) * 4 - 2, 0.25, Math.floor(i / 2) * 2.4 - 4]}
          >
            <mesh>
              <boxGeometry args={[1.3, 0.7, 2]} />
              <meshStandardMaterial
                color={["#f4f0de", "#9faeb1", "#c99d7e"][i % 3]}
              />
            </mesh>
          </group>
        ))}
    </group>
  );
}
function CameraActions({
  command,
}: {
  command: { type: string; tick: number };
}) {
  const controls = useRef<Controls>(null);
  const { camera, invalidate, gl, size } = useThree();
  useEffect(() => {
    camera.zoom = Math.max(2.6, Math.min(9, size.width / 110));
    camera.updateProjectionMatrix();
    invalidate();
  }, [size.width, camera, invalidate]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (command.type === "reset") {
      camera.position.set(56, 55, 65);
      camera.zoom = Math.max(2.6, Math.min(9, size.width / 110));
      c.target.set(0, 0, 0);
    } else if (command.type === "top") {
      camera.position.set(0, 85, 0.1);
      c.target.set(0, 0, 0);
    } else
      camera.zoom = THREE.MathUtils.clamp(
        camera.zoom * (command.type === "in" ? 1.2 : 1 / 1.2),
        5,
        24,
      );
    camera.updateProjectionMatrix();
    c.update();
    invalidate();
  }, [command, camera, invalidate]);
  useEffect(() => {
    gl.domElement.dataset.renderer = "threejs";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [gl]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minZoom={2}
      maxZoom={24}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping={true}
      dampingFactor={0.06}
      target={[0, 0, 0]}
    />
  );
}
export default function Campus({
  selected,
  onSelect,
  layer,
  command,
}: {
  selected: string;
  onSelect: (s: string) => void;
  layer: string;
  command: { type: string; tick: number };
}) {
  const display = usePreferences();
  return (
    <Canvas
      shadows="soft"
      orthographic
      camera={{ position: [56, 55, 65], zoom: 6, near: 0.1, far: 450 }}
      frameloop="demand"
      dpr={display.quality === "low" ? 1 : [1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: display.dark ? 1.06 : 1.08,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(display.dark ? "#879d9d" : "#eaf0e9");
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <ScenePalette />
      <fog
        attach="fog"
        args={[display.dark ? "#879d9d" : "#eaf0e9", 100, 320]}
      />
      <hemisphereLight
        color={display.dark ? "#dce8fb" : "#f0f5ff"}
        groundColor={display.dark ? "#a6ae92" : "#cbd8c0"}
        intensity={display.dark ? 1.5 : 1.25}
      />
      <directionalLight
        position={[25, 55, 25]}
        intensity={display.dark ? 1.8 : 2.3}
        color={display.dark ? "#d6e5d3" : "#fffcf2"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={10}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0003}
      />
      <directionalLight
        position={[-30, 25, -25]}
        intensity={display.dark ? 0.35 : 0.55}
        color="#c2d5e5"
      />
      <mesh position={[0, -0.45, 0]} receiveShadow>
        <boxGeometry args={[92, 1.2, 67]} />
        <meshStandardMaterial
          color={display.dark ? "#1a251b" : "#c8d6bc"}
          roughness={0.88}
          metalness={0.04}
        />
      </mesh>
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[90, 64]} />
        <meshStandardMaterial
          color={display.dark ? "#202d22" : "#dde3cf"}
          roughness={0.9}
          metalness={0.03}
        />
      </mesh>
      {[
        [-25.5, 0, 1.3, 60],
        [-3.4, 0, 1.3, 60],
        [9.1, 0, 1.3, 60],
        [-8, -5.3, 60, 1.3],
        [-8, 1.5, 60, 1.3],
        [-8, 8.2, 60, 1.3],
        [-8, 21.5, 60, 1.3],
      ].map(([x, z, w, d], i) => (
        <mesh
          key={i}
          position={[x, 0.23, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial
            color={display.dark ? "#313f33" : "#f4f0e2"}
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>
      ))}

      {places.map((p) => (
        <Building
          key={p.id}
          p={p}
          selected={selected}
          onSelect={onSelect}
          layer={layer}
        />
      ))}
      <CameraActions command={command} />
    </Canvas>
  );
}
