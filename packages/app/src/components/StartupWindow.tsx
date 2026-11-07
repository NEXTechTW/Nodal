import { useRef } from "react";
import { parseMapFile } from "@linewright/core";
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
      setError(err instanceof Error ? err.message : "Unable to load map file. Choose a .json file exported from Nodal and try again.");
    }
  };

  return (
    <div className="startup-backdrop" role="dialog" aria-modal="true" aria-labelledby="startup-title">
      <div className="startup-window">
        <div className="startup-head">
          <LogoImage height={28} />
          <p className="startup-sub" style={{ marginLeft: 4 }}>Transit map editor</p>
          <span className="startup-badge">v0.3</span>
        </div>
        <h2 id="startup-title" className="startup-title sr-only">Nodal</h2>

        <p className="startup-lead">Start a new map, open the example city, or load a saved file.</p>

        <div className="startup-list" role="list">
          <button
            type="button"
            role="listitem"
            className="startup-item startup-item-primary"
            onClick={() => { setTool("add-station"); onClose(); }}
          >
            <span className="startup-icon" aria-hidden="true"><AddStationIcon /></span>
            <span className="startup-item-text">
              <span className="startup-item-title">New map</span>
              <span className="startup-item-desc">Blank canvas, ready to place stations</span>
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
              <span className="startup-item-title">Open example</span>
              <span className="startup-item-desc">Lumen City — the fictional city with three lines</span>
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
              <span className="startup-item-title">Load JSON…</span>
              <span className="startup-item-desc">Open a Nodal map file (schema v1)</span>
            </span>
            <span className="startup-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="startup-foot">
          <span>Keys: V select · A add · C connect · H pan</span>
          <span className="startup-foot-sep" aria-hidden="true">·</span>
          <a href="https://github.com/NEXTechTW/Nodal" target="_blank" rel="noreferrer noopener">GitHub</a>
        </div>

        <CrowdinPanel lang={uiLang} />

        <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      </div>
    </div>
  );
}
