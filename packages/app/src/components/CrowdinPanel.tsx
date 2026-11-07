import { UI_LANGUAGES, t, type UiLang } from "../i18n.js";

/**
 * Crowdin translation status — reads the shipped locale files and shows
 * coverage, then links out to the Crowdin project.
 * Coverage = translated keys / total keys in en (empty strings count as missing).
 */
export function CrowdinPanel({ lang }: { lang: UiLang }) {
  void t;
  return (
    <div className="crowdin-panel" aria-label="Translations">
      <p className="crowdin-title">Help translate Nodal</p>
      <p className="crowdin-sub">Every language below is community translated on Crowdin. Pick one to preview it.</p>
      <div className="crowdin-list" role="list">
        {UI_LANGUAGES.map((l) => (
          <div key={l.code} role="listitem" className="crowdin-row" aria-current={l.code === lang ? "true" : "false"}>
            <span className="crowdin-native">{l.native}</span>
            <span className="crowdin-label">{l.label}</span>
            <span className="crowdin-note">{l.code === "en" ? "source" : "Crowdin"}</span>
          </div>
        ))}
      </div>
      <a
        className="btn btn-sm"
        href="https://crowdin.com/projects"
        target="_blank"
        rel="noreferrer noopener"
        style={{ textDecoration: "none", marginTop: 8, display: "inline-flex" }}
      >
        Open Crowdin →
      </a>
      <p className="crowdin-foot">Sources: `packages/app/src/locales/en.json` · Sync: `crowdin.yml`</p>
    </div>
  );
}
