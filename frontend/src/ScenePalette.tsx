import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { usePreferences } from "./preferences";
export default function ScenePalette() {
  const { gl, invalidate } = useThree();
  const { dark } = usePreferences();
  useEffect(() => {
    gl.setClearColor(dark ? "#233029" : "#eaf0e9");
    invalidate();
  }, [dark, gl, invalidate]);
  return null;
}
