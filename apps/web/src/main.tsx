import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "@linewright/app";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);
