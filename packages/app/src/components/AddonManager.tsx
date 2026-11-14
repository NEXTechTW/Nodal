import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";
import { ThemePicker } from "./ThemePicker.js";

export type AddonCategory = "all" | "transit" | "localization" | "integrations" | "templates" | "enabled";

export interface AddonMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  githubUrl?: string;
  category: "transit" | "localization" | "integrations" | "templates";
  source: "core" | "official" | "community";
  desc: string;
  longDesc?: string;
  features?: string[];
  tags: string[];
  defaultEnabled?: boolean;
}

// Loaded online from the addon's repo — nothing bundled.
// Falls back to an empty list offline.
const CATALOG: AddonMetadata[] = [];
const REMOTE_MANIFEST = "https://cdn.jsdelivr.net/gh/xft0729/nodal-addon-theme@main/addon.json";

export function AddonManager({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("nodal:addons");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      /* ignore */
    }
    // Default fallback
    const defaults: Record<string, boolean> = {};
    for (const a of CATALOG) {
      defaults[a.id] = a.defaultEnabled !== false;
    }
    return defaults;
  });

  const [catalog, setCatalog] = useState<AddonMetadata[]>(CATALOG);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<AddonCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  useEffect(() => {
    let cancelled = false;
    fetch(REMOTE_MANIFEST)
      .then((r) => (r.ok ? r.json() : null))
      .then((meta: AddonMetadata | null) => {
        if (!cancelled && meta?.id) setCatalog([meta]);
      })
      .catch(() => { /* offline: stay empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("nodal:addons", JSON.stringify(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const current = prev[id] !== false;
      return { ...prev, [id]: !current };
    });
  };

  const enableAll = () => {
    const next: Record<string, boolean> = {};
    for (const item of CATALOG) {
      next[item.id] = true;
    }
    setEnabled(next);
  };

  const disableAll = () => {
    const next: Record<string, boolean> = {};
    for (const item of CATALOG) {
      next[item.id] = false;
    }
    setEnabled(next);
  };

  const resetDefaults = () => {
    const next: Record<string, boolean> = {};
    for (const item of CATALOG) {
      next[item.id] = item.defaultEnabled !== false;
    }
    setEnabled(next);
  };

  // Filtered list
  const filteredAddons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((addon) => {
      // Category filter
      if (activeCategory === "enabled") {
        if (enabled[addon.id] === false) return false;
      } else if (activeCategory !== "all") {
        if (addon.category !== activeCategory) return false;
      }

      // Search query
      if (q) {
        const matchesName = addon.name.toLowerCase().includes(q);
        const matchesDesc = addon.desc.toLowerCase().includes(q);
        const matchesAuthor = addon.author.toLowerCase().includes(q);
        const matchesTags = addon.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesAuthor && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [activeCategory, searchQuery, enabled]);

  // Category counts
  const counts = useMemo(() => {
    const c = {
      all: catalog.length,
      transit: 0,
      localization: 0,
      integrations: 0,
      templates: 0,
      enabled: 0,
    };
    for (const a of catalog) {
      if (a.category in c) {
        c[a.category]++;
      }
      if (enabled[a.id] !== false) {
        c.enabled++;
      }
    }
    return c;
  }, [catalog, enabled]);

  return (
    <div
      className="addon-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addon-manager-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="addon-modal">
        {/* Header */}
        <div className="addon-modal-header">
          <div className="addon-modal-title-wrap">
            <div className="addon-modal-icon-badge" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <div className="addon-title-row">
                <h2 id="addon-manager-title" className="addon-modal-title">{tr("AddonsModalTitle")}</h2>
                <span className="addon-badge-count">{counts.enabled} {tr("Of")} {catalog.length} {tr("ActivePacksCount")}</span>
              </div>
              <p className="addon-modal-sub">
                {tr("AddonsModalSub")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="addon-close-btn"
            onClick={onClose}
            aria-label={tr("CloseShortcuts")}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="addon-modal-toolbar">
          <div className="addon-search-wrap">
            <svg className="addon-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="addon-search-input"
              placeholder={tr("SearchAddons")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="addon-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="addon-batch-actions">
            <button type="button" className="addon-action-link" onClick={enableAll}>
              {tr("EnableAll")}
            </button>
            <span className="addon-sep">•</span>
            <button type="button" className="addon-action-link" onClick={disableAll}>
              {tr("DisableAll")}
            </button>
            <span className="addon-sep">•</span>
            <button type="button" className="addon-action-link" onClick={resetDefaults}>
              {tr("Reset")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="addon-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            className={`addon-tab ${activeCategory === "all" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            {tr("All")} <span className="addon-tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "transit"}
            className={`addon-tab ${activeCategory === "transit" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("transit")}
          >
            {tr("TransitDesign")} <span className="addon-tab-count">{counts.transit}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "localization"}
            className={`addon-tab ${activeCategory === "localization" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("localization")}
          >
            {tr("LocalizationFonts")} <span className="addon-tab-count">{counts.localization}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "integrations"}
            className={`addon-tab ${activeCategory === "integrations" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("integrations")}
          >
            {tr("Integrations")} <span className="addon-tab-count">{counts.integrations}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "templates"}
            className={`addon-tab ${activeCategory === "templates" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("templates")}
          >
            {tr("Templates")} <span className="addon-tab-count">{counts.templates}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "enabled"}
            className={`addon-tab ${activeCategory === "enabled" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("enabled")}
          >
            {tr("ActiveOnly")} <span className="addon-tab-count">{counts.enabled}</span>
          </button>
        </div>

        {/* List of Addons */}
        <div className="addon-list" role="list">
          {loading ? (
            <div className="addon-empty-state">
              <p className="addon-empty-title">Loading addons…</p>
              <p className="addon-empty-sub">From cdn.jsdelivr.net.</p>
            </div>
          ) : filteredAddons.length === 0 ? (
            <div className="addon-empty-state">
              <div className="addon-empty-icon" aria-hidden="true">🔍</div>
              <p className="addon-empty-title">{tr("NoAddonsFound")}</p>
              <p className="addon-empty-sub">
                {searchQuery
                  ? `No results for "${searchQuery}".`
                  : "Could not load the list. Check your connection and try again."}
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                {tr("ClearFilter")}
              </button>
            </div>
          ) : (
            filteredAddons.map((addon) => {
              const isOn = enabled[addon.id] !== false;
              const isExpanded = expandedId === addon.id;

              return (
                <div
                  key={addon.id}
                  role="listitem"
                  className={`addon-card ${isOn ? "is-enabled" : "is-disabled"}`}
                >
                  <div className="addon-card-main">
                    <div className="addon-icon-box" aria-hidden="true">
                      {addon.category === "transit" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="14" rx="2" />
                          <path d="M4 11h16" />
                          <path d="M12 4v7" />
                          <path d="m8 18-3 3" />
                          <path d="m16 18 3 3" />
                        </svg>
                      )}
                      {addon.category === "localization" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      )}
                      {addon.category === "integrations" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      )}
                      {addon.category === "templates" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )}
                    </div>

                    <div className="addon-content">
                      <div className="addon-top-row">
                        <div className="addon-heading-group">
                          <div className="addon-title-line">
                            <h3 className="addon-name">{addon.name}</h3>
                            <span className="addon-version">v{addon.version}</span>
                            <span className={`addon-source-tag addon-source-${addon.source}`}>
                              {addon.source}
                            </span>
                          </div>

                          {/* Author & GitHub repository link */}
                          <div className="addon-byline">
                            <span className="addon-author-label">{tr("ByAuthor")} @{addon.author}</span>
                            {addon.githubUrl && (
                              <a
                                href={addon.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="addon-github-pill"
                                title={`Open ${addon.name} on GitHub`}
                                aria-label={`GitHub repository for ${addon.name}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg
                                  className="addon-github-icon"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                  />
                                </svg>
                                <span>GitHub</span>
                                <svg
                                  className="addon-external-arrow"
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  aria-hidden="true"
                                >
                                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <label className="addon-switch" title={isOn ? "Disable addon" : "Enable addon"}>
                          <input
                            type="checkbox"
                            checked={isOn}
                            onChange={() => toggle(addon.id)}
                            role="switch"
                            aria-checked={isOn}
                            aria-label={`Toggle ${addon.name}`}
                          />
                          <span className="addon-slider" />
                        </label>
                      </div>

                      <p className="addon-desc">{addon.desc}</p>

                      <div className="addon-footer-row">
                        <div className="addon-tags">
                          {addon.tags.map((tag) => (
                            <span key={tag} className="addon-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="addon-detail-toggle"
                          onClick={() => setExpandedId(isExpanded ? null : addon.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? tr("LessDetails") : tr("Details")}
                        </button>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="addon-details-box">
                          {addon.longDesc && <p className="addon-details-text">{addon.longDesc}</p>}
                          {addon.features && addon.features.length > 0 && (
                            <ul className="addon-features-list">
                              {addon.features.map((feat) => (
                                <li key={feat}>{feat}</li>
                              ))}
                            </ul>
                          )}
                          <ThemePicker />
                          <div className="addon-meta-row">
                            <span className="addon-meta-item">
                              {tr("PackageId")}: <code>{addon.id}</code>
                            </span>
                            {addon.githubUrl && (
                              <>
                                <span className="addon-meta-sep">•</span>
                                <a
                                  href={addon.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="addon-meta-link"
                                >
                                  {tr("BrowseSourceCode")}
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="addon-modal-footer">
          <div className="addon-modal-footer-info">
            <span>{tr("SettingsSavedLocally")}</span>
            <span className="addon-sep">•</span>
            <kbd className="addon-kbd">Esc</kbd>
            <span className="addon-dim">{tr("PressEscToClose")}</span>
          </div>
          <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>
            {tr("Done")}
          </button>
        </div>
      </div>
    </div>
  );
}
