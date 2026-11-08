import { useState } from "react";
import { MarkDesigner } from "./MarkDesigner.js";

/** Opens the standalone mark designer window. */
export function MarkEditor() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen(true)}>
        Mark
      </button>
      {open && <MarkDesigner onClose={() => setOpen(false)} />}
    </>
  );
}
