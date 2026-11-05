import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { usePreferences } from "./preferences";
export default function ScenePalette() {
  const { gl, invalidate } = useThree();
  const { dark } = usePreferences();
  useEffect(() => {
    gl.setClearColor(dark ? "#879d9d" : "#eaf0e9");
    invalidate();
  }, [dark, gl, invalidate]);
  return null;
}
