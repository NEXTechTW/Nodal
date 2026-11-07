import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import { crossroadTemplate, exampleMap } from "../example.js";
import {
  BookIcon,
  CheckIcon,
  CloseIcon,
  CompassIcon,
  ExternalLinkIcon,
  FolderOpenIcon,
  GitHubIcon,
  KeyboardIcon,
  PlusIcon,
  SparklesIcon,
} from "./Icons.js";

/** Transit graphic icon representing Nodal's schematic network engine */
function NodalLogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 44 44" fill="none" aria-hidden="true" focusable="false" className="startup-logo-svg">
      <rect width="44" height="44" rx="10" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.2" />
      {/* Metro Lines */}
      {/* Red Line */}
      <path d="M7 22h18l8 8h4" stroke="#E00034" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Blue Line */}
      <path d="M22 7v18l8 8v4" stroke="#0067C0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Green Line */}
      <path d="M7 35l10-10h12" stroke="#009444" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 2" />
      {/* Transfer Interchange Hub at (22, 22) */}
      <circle cx="22" cy="22" r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="22" cy="22" r="2" fill="#0F172A" />
      {/* Station Terminals */}
      <circle cx="10" cy="22" r="2.2" fill="#FFFFFF" stroke="#E00034" strokeWidth="1.5" />
      <circle cx="22" cy="10" r="2.2" fill="#FFFFFF" stroke="#0067C0" strokeWidth="1.5" />
      <circle cx="34" cy="30" r="2.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.8" />
    </svg>
  );
}

/** Rich startup and welcome window shown to onboard users and launch projects. */
export function StartupWindow({ onClose }: { onClose: () => void }) {
  const loadMap = useEditor((s) => s.loadMap);
  const setError = useEditor((s) => s.setError);
  const setToast = useEditor((s) => s.setToast);
  const setTool = useEditor((s) => s.setTool);

  const fileRef = useRef<HTMLInputElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hideOnLaunch, setHideOnLaunch] = useState(() => {
    try {
      return localStorage.getItem("nodal:hide_startup") === "true";
    } catch {
      return false;
    }
  });

  // Focus primary button on mount and handle Escape key to dismiss
  useEffect(() => {
    primaryBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleHideOnLaunch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHideOnLaunch(checked);
    try {
      if (checked) {
        localStorage.setItem("nodal:hide_startup", "true");
      } else {
        localStorage.removeItem("nodal:hide_startup");
      }
    } catch {
      /* ignore storage errors */
    }
  };

  const parseAndLoad = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseMapFile(text);
      loadMap(parsed);
      setToast(`Loaded map: ${parsed.meta.title || "Untitled"}`);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load map file. Please choose a valid .json transit map file exported from Nodal."
      );
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) await parseAndLoad(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      await parseAndLoad(f);
    }
  };

  const handleNewMap = () => {
    setTool("add-station");
    setToast("Created new map — click canvas to add stations");
    onClose();
  };

  const handleOpenExample = () => {
    loadMap(exampleMap());
    setToast("Loaded Lumen City example map");
    onClose();
  };

  const handleOpenTemplate = () => {
    loadMap(crossroadTemplate());
    setToast("Loaded Metropolis Hub template");
    onClose();
  };

  return (
    <div
      className="startup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="startup-title"
      aria-describedby="startup-subtitle"
      onClick={(e) => {
        // Dismiss if user clicks directly on backdrop outside the window
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="startup-window" ref={dialogRef}>
        {/* Header bar */}
        <header className="startup-header">
          <div className="startup-brand">
            <NodalLogoMark />
            <div className="startup-title-group">
              <div className="startup-heading-row">
                <h2 id="startup-title" className="startup-title">Nodal</h2>
                <span className="startup-badge">v0.3.0 Beta</span>
                <span className="startup-pill">Open Source</span>
              </div>
              <p id="startup-subtitle" className="startup-sub">
                Intuitive transit & schematic map studio. Design octolinear rail and metro networks.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn startup-close-btn"
            aria-label="Close welcome window"
            title="Close (Esc)"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Modal body grid: 2 columns on desktop */}
        <div className="startup-content">
          {/* Left Column: Actions, Starters & File Drop */}
          <section className="startup-column startup-left-col" aria-label="Start project options">
            <div className="startup-section-heading">
              <SparklesIcon />
              <span>Get Started</span>
            </div>

            {/* Primary Hero Action Card: New Map */}
            <div className="startup-hero-card">
              <div className="startup-hero-info">
                <div className="startup-hero-tag">Empty Project</div>
                <h3 className="startup-hero-title">New Transit Map</h3>
                <p className="startup-hero-desc">
                  Start fresh with an infinite vector canvas. Activates the Station tool for immediate placement.
                </p>
              </div>
              <button
                ref={primaryBtnRef}
                type="button"
                className="btn btn-primary startup-hero-btn"
                onClick={handleNewMap}
              >
                <PlusIcon />
                <span>Create New Map</span>
              </button>
            </div>

            {/* Template Gallery */}
            <div className="startup-templates-wrap">
              <div className="startup-subheading">Or choose a starter template</div>
              <div className="startup-template-list">
                {/* Template 1: Lumen City */}
                <div className="startup-template-card">
                  <div className="startup-template-header">
                    <div className="startup-template-title-wrap">
                      <h4 className="startup-template-title">Lumen City (Example)</h4>
                      <span className="startup-tag">Featured</span>
                    </div>
                    <div className="startup-line-pills" aria-label="Lines in this map">
                      <span className="line-pill" style={{ backgroundColor: "#E00034" }} title="Harbor Line (Red)"></span>
                      <span className="line-pill" style={{ backgroundColor: "#0067C0" }} title="Garden Line (Blue)"></span>
                      <span className="line-pill line-pill-dashed" style={{ backgroundColor: "#009444" }} title="North Loop (Green)"></span>
                    </div>
                  </div>
                  <p className="startup-template-desc">
                    Full metro network with 8 stations, 3 lines, parallel corridors, and transfer hubs.
                  </p>
                  <div className="startup-template-footer">
                    <span className="startup-template-meta">8 stations · 3 lines · Transfers</span>
                    <button
                      type="button"
                      className="btn btn-sm startup-template-btn"
                      onClick={handleOpenExample}
                    >
                      Open example
                    </button>
                  </div>
                </div>

                {/* Template 2: Metropolis Hub */}
                <div className="startup-template-card">
                  <div className="startup-template-header">
                    <div className="startup-template-title-wrap">
                      <h4 className="startup-template-title">Crossroad Hub (Starter)</h4>
                      <span className="startup-tag startup-tag-secondary">2-Line Spine</span>
                    </div>
                    <div className="startup-line-pills" aria-label="Lines in this template">
                      <span className="line-pill" style={{ backgroundColor: "#E00034" }} title="East-West Line"></span>
                      <span className="line-pill" style={{ backgroundColor: "#0067C0" }} title="North-South Line"></span>
                    </div>
                  </div>
                  <p className="startup-template-desc">
                    Dual-corridor crossroads with 6 stations and a grand central interchange hub at 45° angles.
                  </p>
                  <div className="startup-template-footer">
                    <span className="startup-template-meta">6 stations · 2 lines · Radial</span>
                    <button
                      type="button"
                      className="btn btn-sm startup-template-btn"
                      onClick={handleOpenTemplate}
                    >
                      Use template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              className={`startup-dropzone ${isDragging ? "dropzone-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              aria-label="Upload or drop existing Nodal JSON map file"
            >
              <div className="startup-dropzone-icon">
                <FolderOpenIcon />
              </div>
              <div className="startup-dropzone-text">
                <span className="startup-dropzone-title">
                  {isDragging ? "Release file to load map" : "Drop a map JSON file here"}
                </span>
                <span className="startup-dropzone-sub">
                  or click to select file from your computer
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm startup-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                Browse JSON…
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                aria-label="Load map JSON file"
                hidden
                onChange={onFileInputChange}
              />
            </div>
          </section>

          {/* Right Column: Shortcuts & Transit Studio Reference */}
          <section className="startup-column startup-right-col" aria-label="Studio shortcuts and tips">
            <div className="startup-section-heading">
              <KeyboardIcon />
              <span>Essential Shortcuts</span>
            </div>

            {/* Shortcut table */}
            <div className="startup-shortcuts-card">
              <div className="startup-shortcut-row">
                <div className="startup-shortcut-action">Select & Move</div>
                <div className="startup-keys"><kbd className="kbd">V</kbd> / <kbd className="kbd">1</kbd></div>
              </div>
              <div className="startup-shortcut-row">
                <div className="startup-shortcut-action">Add Station</div>
                <div className="startup-keys"><kbd className="kbd">A</kbd> / <kbd className="kbd">S</kbd> / <kbd className="kbd">2</kbd></div>
              </div>
              <div className="startup-shortcut-row">
                <div className="startup-shortcut-action">Connect Stations</div>
                <div className="startup-keys"><kbd className="kbd">C</kbd> / <kbd className="kbd">3</kbd></div>
              </div>
              <div className="startup-shortcut-row">
                <div className="startup-shortcut-action">Pan Canvas</div>
                <div className="startup-keys"><kbd className="kbd">Space</kbd> / <kbd className="kbd">4</kbd></div>
              </div>
              <div className="startup-shortcut-row">
                <div className="startup-shortcut-action">Undo / Redo</div>
                <div className="startup-keys"><kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">Z</kbd> / <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">⇧</kbd>+<kbd className="kbd">Z</kbd></div>
              </div>
            </div>

            {/* Design Features Highlights */}
            <div className="startup-features-card">
              <div className="startup-features-heading">
                <CompassIcon />
                <span>Transit Engine Capabilities</span>
              </div>
              <ul className="startup-features-list">
                <li>
                  <strong>Octolinear Geometry:</strong> Snap station links to standard 45° and 90° angles for crisp transit schematics.
                </li>
                <li>
                  <strong>Parallel Corridors:</strong> Automatic offset calculation keeps multi-line tracks distinct without overlapping.
                </li>
                <li>
                  <strong>Smart Label Clearance:</strong> One-click label layout avoids collisions and repositions station anchors.
                </li>
                <li>
                  <strong>Lossless Vector Export:</strong> Export clean SVG, high-res PNG, or print-ready PDF formats anytime.
                </li>
              </ul>
            </div>

            {/* Pro Tip Callout */}
            <div className="startup-tip-card">
              <div className="startup-tip-title">
                <CheckIcon />
                <span>Quick Tip</span>
              </div>
              <p className="startup-tip-text">
                Toggle between light and dark workbench themes in the <strong>View</strong> menu. You can re-open this welcome screen anytime via <strong>Help &gt; Welcome &amp; Quick Start</strong>.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Bar */}
        <footer className="startup-footer">
          <label className="startup-toggle-wrap">
            <input
              type="checkbox"
              className="startup-checkbox"
              checked={hideOnLaunch}
              onChange={toggleHideOnLaunch}
            />
            <span>Don't show this screen automatically on startup</span>
          </label>

          <div className="startup-footer-actions">
            <div className="startup-links">
              <a
                href="https://github.com/NEXTechTW/Nodal"
                target="_blank"
                rel="noreferrer noopener"
                className="startup-link"
                title="Open Nodal GitHub repository"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </a>
              <a
                href="https://github.com/NEXTechTW/Nodal/blob/main/docs/TUTORIAL.md"
                target="_blank"
                rel="noreferrer noopener"
                className="startup-link"
                title="Read documentation tutorial"
              >
                <BookIcon />
                <span>Tutorial</span>
                <ExternalLinkIcon />
              </a>
            </div>

            <button
              type="button"
              className="btn startup-dismiss-btn"
              onClick={onClose}
            >
              <span>Skip to Editor</span>
              <kbd className="kbd kbd-subtle">Esc</kbd>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
