import { useRef } from "react";
import { parseMapFile } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import { exampleMap } from "../example.js";
import { PlusIcon } from "./Icons.js";

/** Startup project window shown over a blurred editor until dismissed. */
export function StartupWindow({ onClose }: { onClose: () => void }) {
  const loadMap = useEditor((s) => s.loadMap);
  const setError = useEditor((s) => s.setError);
  const setTool = useEditor((s) => s.setTool);
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
        <h2 id="startup-title" className="startup-title">Nodal</h2>
        <p className="startup-sub">Transit map editor. Pick how you want to start.</p>

        <div className="startup-actions">
          <button
            type="button"
            className="btn btn-primary startup-main"
            onClick={() => { setTool("add-station"); onClose(); }}
          >
            <PlusIcon /> New map
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => { loadMap(exampleMap()); onClose(); }}
          >
            Open example
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => fileRef.current?.click()}
          >
            Load JSON…
          </button>
        </div>

        <p className="startup-note">
          New map keeps the editor open and selects the Add-station tool. Open example loads the fictional Lumen City.
        </p>
        <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      </div>
    </div>
  );
}
