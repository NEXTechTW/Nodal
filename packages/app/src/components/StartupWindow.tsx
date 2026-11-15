import { useRef } from "react";
import { parseMapFile } from "@nodal/core";
import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";
import { exampleMap } from "../example.js";
import { AddStationIcon, LoadIcon } from "./Icons.js";
import { LogoImage } from "./LogoImage.js";
import { CrowdinPanel } from "./CrowdinPanel.js";

/** Startup project window shown over a blurred editor until dismissed. */
export function StartupWindow({ onClose }: { onClose: () => void }) {
  const loadMap = useEditor((s) => s.loadMap);
  const setError = useEditor((s) => s.setError);
  const setTool = useEditor((s) => s.setTool);
  const uiLang = useEditor((s) => s.uiLang);
  const L = (k: string) => t(uiLang, k);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      loadMap(parseMapFile(text));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load that file. Choose a .json map from Nodal.");
    }
  };

  return (
    <div className="startup-backdrop" role="dialog" aria-modal="true" aria-labelledby="startup-title">
      <div className="startup-window">
        <div className="startup-main">
        <div className="startup-head">
          <LogoImage height={28} />
          <span className="startup-badge">v0.4</span>
        </div>
        <h2 id="startup-title" className="startup-title">{L("AppSubtitle")}</h2>

        <p className="startup-lead">{L("StartupLead")}</p>

        <div className="startup-art" aria-hidden="true">
          <svg viewBox="0 0 560 200" fill="none" focusable="false">
            <defs>
              <pattern id="welcome-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="currentColor" opacity=".16" />
              </pattern>
            </defs>
            <path fill="url(#welcome-grid)" d="M0 0h560v200H0z" />
            <g strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M-20 146h132l66-66h142l64 64h196" stroke="#619fff" />
              <path d="M80-20v56l110 110h102l92-92h196" stroke="#bd99ff" />
              <path d="M236 220v-52l88-88V-20" stroke="#f5b45f" />
            </g>
            <g fill="#20232b" stroke="#f1f3fa" strokeWidth="3">
              <circle cx="66" cy="146" r="5" /><circle cx="138" cy="120" r="5" />
              <circle cx="232" cy="80" r="5" /><circle cx="354" cy="114" r="5" />
              <circle cx="446" cy="144" r="5" /><circle cx="80" cy="22" r="5" />
              <circle cx="124" cy="80" r="5" /><circle cx="410" cy="54" r="5" />
              <circle cx="494" cy="54" r="5" /><circle cx="236" cy="190" r="5" />
              <circle cx="324" cy="24" r="5" />
              <rect x="157" y="132" width="13" height="28" rx="6.5" transform="rotate(-45 157 132)" />
              <circle cx="324" cy="80" r="8" /><circle cx="258" cy="146" r="8" />
            </g>
          </svg>
        </div>

        <div className="startup-list" role="list">
          <button
            type="button"
            role="listitem"
            className="startup-item startup-item-primary"
            onClick={() => { setTool("add-station"); onClose(); }}
          >
            <span className="startup-icon" aria-hidden="true"><AddStationIcon /></span>
            <span className="startup-item-text">
              <span className="startup-item-title">{L("NewMap")}</span>
              <span className="startup-item-desc">{L("BlankCanvasDesc")}</span>
            </span>
            <span className="startup-arrow" aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            role="listitem"
            className="startup-item"
            onClick={() => { loadMap(exampleMap()); onClose(); }}
          >
            <span className="startup-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" /></svg>
            </span>
            <span className="startup-item-text">
              <span className="startup-item-title">{L("OpenExample")}</span>
              <span className="startup-item-desc">{L("ExampleCityDesc")}</span>
            </span>
            <span className="startup-arrow" aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            role="listitem"
            className="startup-item"
            onClick={() => fileRef.current?.click()}
          >
            <span className="startup-icon" aria-hidden="true"><LoadIcon /></span>
            <span className="startup-item-text">
              <span className="startup-item-title">{L("LoadJSON")}</span>
              <span className="startup-item-desc">{L("LoadJsonDesc")}</span>
            </span>
            <span className="startup-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="startup-foot">
          <span>{L("StartupShortcuts")}</span>
          <span className="startup-foot-sep" aria-hidden="true">·</span>
          <a href="https://github.com/NEXTechTW/Nodal" target="_blank" rel="noreferrer noopener">GitHub</a>
        </div>

        </div>

        <aside className="startup-community">
          <CrowdinPanel lang={uiLang} />
        </aside>

        <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      </div>
    </div>
  );
}
