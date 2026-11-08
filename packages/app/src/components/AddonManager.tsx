import { useEffect, useState } from "react";

/**
 * Addon manager — built-in packs for Nodal.
 * Toggles persist in localStorage; packs are plain flags for now.
 */
export interface Addon {
  id: string;
  name: string;
  desc: string;
}

const ADDONS: Addon[] = [
  { id: "transit-presets", name: "Transit presets", desc: "Line color palette + rounded defaults" },
  { id: "languages", name: "Language packs", desc: "Seven Crowdin-synced UI languages" },
  { id: "google-fonts", name: "Google Fonts", desc: "Loads the font library for map labels" },
  { id: "aarc-import", name: "AARC import", desc: "Open .aarc.json maps (points, lines, transfers)" },
  { id: "examples", name: "Example city", desc: "Fictional Lumen City map" },
];

export function AddonManager({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("nodal:addons") ?? "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("nodal:addons", JSON.stringify(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  const toggle = (id: string) =>
    setEnabled((s) => ({ ...s, [id]: s[id] === false ? true : false }));

  return (
    <div className="startup-backdrop" role="dialog" aria-modal="true" aria-labelledby="addon-title">
      <div className="startup-window" style={{ width: "min(520px, 100%)" }}>
        <div className="startup-head">
          <div className="startup-head-text">
            <h2 id="addon-title" className="startup-title">Addons</h2>
            <p className="startup-sub">Built-in packs. Toggle on or off.</p>
          </div>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close addons">×</button>
        </div>
        <div className="startup-list" role="list" style={{ marginTop: 12 }}>
          {ADDONS.map((a) => {
            const on = enabled[a.id] !== false;
            return (
              <div key={a.id} role="listitem" className="startup-item">
                <span className="startup-icon" aria-hidden="true">＋</span>
                <span className="startup-item-text">
                  <span className="startup-item-title">{a.name}</span>
                  <span className="startup-item-desc">{a.desc}</span>
                </span>
                <button
                  type="button"
                  className={`btn btn-sm ${on ? "btn-primary" : ""}`}
                  aria-pressed={on}
                  onClick={() => toggle(a.id)}
                >
                  {on ? "On" : "Off"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="startup-note">More addons land here as the plugin API grows.</p>
      </div>
    </div>
  );
}
