import { useEffect, useRef } from "react";
import { parseMapFile } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import { exampleMap } from "../example.js";

export function StartupWindow({ onClose }: { onClose: () => void }) {
  const loadMap = useEditor((s) => s.loadMap);
  const setError = useEditor((s) => s.setError);
  const setTool = useEditor((s) => s.setTool);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div
      className="startup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="startup-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="startup-window">
        <h2 id="startup-title">Nodal</h2>
        <p>Transit map editor</p>

        <div className="startup-actions">
          <button ref={firstBtn} type="button" className="btn btn-primary" onClick={() => { setTool("add-station"); onClose(); }}>
            New map
          </button>
          <button type="button" className="btn" onClick={() => { loadMap(exampleMap()); onClose(); }}>
            Open example
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Load JSON…
          </button>
        </div>

        <button type="button" className="startup-skip" onClick={onClose}>
          Skip
        </button>

        <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      </div>
    </div>
  );
}
