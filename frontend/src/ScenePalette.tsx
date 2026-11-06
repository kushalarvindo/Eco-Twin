import { useStudio } from "./CampusStudio";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { usePreferences } from "./preferences";
export default function ScenePalette() {
  const { gl, invalidate } = useThree();
  const studio = useStudio();
  const { dark } = usePreferences();
  useEffect(() => {
    if (studio?.mode === "sun") return;
    gl.setClearColor(dark ? "#879d9d" : "#eaf0e9");
    invalidate();
  }, [dark, studio?.mode, gl, invalidate]);
  return null;
}
