import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Moon, Sun, Settings2, X, RotateCcw } from "lucide-react";
import { defaults, updatePreferences, usePreferences } from "./preferences";
export default function PreferencesPanel() {
  const p = usePreferences(),
    [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="icon-button"
        aria-label={p.dark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => updatePreferences({ theme: p.dark ? "light" : "dark" })}
      >
        {p.dark ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="icon-button" aria-label="Customize workspace">
            <Settings2 size={19} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal preferences">
            <div className="modal-head">
              <div>
                <Dialog.Title>Make this space yours.</Dialog.Title>
                <Dialog.Description>
                  Display preferences stay on this device. Your account and
                  campus data are unchanged.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="icon-button"
                aria-label="Close customization"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
            <div className="form-stack">
              <label>
                Appearance
                <select
                  value={p.theme}
                  onChange={(e) =>
                    updatePreferences({
                      theme: e.target.value as typeof p.theme,
                    })
                  }
                >
                  <option value="system">Follow system</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label>
                Accent color
                <select
                  value={p.accent}
                  onChange={(e) =>
                    updatePreferences({
                      accent: e.target.value as typeof p.accent,
                    })
                  }
                >
                  <option value="forest">Forest green</option>
                  <option value="ocean">Ocean blue</option>
                  <option value="clay">Earthy clay</option>
                </select>
              </label>
              <div className="form-two">
                <label>
                  Layout density
                  <select
                    value={p.density}
                    onChange={(e) =>
                      updatePreferences({
                        density: e.target.value as typeof p.density,
                      })
                    }
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
                <label>
                  Text size
                  <select
                    value={p.text}
                    onChange={(e) =>
                      updatePreferences({
                        text: e.target.value as typeof p.text,
                      })
                    }
                  >
                    <option value="standard">Standard</option>
                    <option value="large">Larger</option>
                  </select>
                </label>
              </div>
              <div className="form-two">
                <label>
                  Default campus view
                  <select
                    value={p.view}
                    onChange={(e) =>
                      updatePreferences({
                        view: e.target.value as typeof p.view,
                      })
                    }
                  >
                    <option value="3d">3D explorer</option>
                    <option value="2d">2D map</option>
                  </select>
                </label>
                <label>
                  3D rendering
                  <select
                    value={p.quality}
                    onChange={(e) =>
                      updatePreferences({
                        quality: e.target.value as typeof p.quality,
                      })
                    }
                  >
                    <option value="balanced">Balanced</option>
                    <option value="low">Low power</option>
                  </select>
                </label>
              </div>
              <label className="preference-check">
                <input
                  type="checkbox"
                  checked={p.motion}
                  onChange={(e) =>
                    updatePreferences({ motion: e.target.checked })
                  }
                />{" "}
                Reduce interface motion
              </label>
              <p className="muted small-text">
                Low-power mode lowers pixel resolution. The 2D map works without
                WebGL. New default-view settings apply the next time the
                explorer opens.
              </p>
              <button
                className="button secondary"
                onClick={() => updatePreferences(defaults)}
              >
                <RotateCcw size={16} /> Reset display preferences
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
