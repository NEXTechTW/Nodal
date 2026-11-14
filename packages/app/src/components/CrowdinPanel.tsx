import { UI_LANGUAGES, dicts, t, type UiLang } from "../i18n.js";

/** Live coverage for each locale: how many en keys have a non-empty translation. */
function coverage(lang: UiLang): number {
  const enKeys = Object.keys(dicts.en);
  if (enKeys.length === 0) return 0;
  const d = dicts[lang];
  if (!d) return 0;
  let done = 0;
  for (const k of enKeys) {
    const v = d[k];
    if (typeof v === "string" && v.trim() !== "") {
      done++;
    }
  }
  return Math.round((done / enKeys.length) * 100);
}

/**
 * Crowdin status — local file coverage as a live estimate.
 * The canonical number lives on Crowdin; this mirrors the shipped JSON.
 */
export function CrowdinPanel({ lang }: { lang: UiLang }) {
  const tr = (k: string) => t(lang, k);

  return (
    <div className="crowdin-panel" aria-label={tr("Translate")}>
      <p className="crowdin-title">{tr("CrowdinPanelTitle")}</p>
      <p className="crowdin-sub">{tr("CrowdinPanelSub")}</p>
      <div className="crowdin-list" role="list">
        {UI_LANGUAGES.map((l) => {
          const pct = coverage(l.code);
          return (
            <div key={l.code} role="listitem" className="crowdin-row" aria-current={l.code === lang ? "true" : "false"}>
              <span className="crowdin-native">{l.native}</span>
              <span className="crowdin-label">{l.label}</span>
              <span className="crowdin-bar" aria-hidden="true">
                <span className="crowdin-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="crowdin-pct" aria-label={`${pct}% translated`}>{pct}%</span>
              <span className="crowdin-note">{l.code === "en" ? "source" : "Crowdin"}</span>
            </div>
          );
        })}
      </div>
      <a
        className="btn btn-sm"
        href="https://crowdin.com/project/nodal"
        target="_blank"
        rel="noreferrer noopener"
        style={{ textDecoration: "none", marginTop: 8, display: "inline-flex" }}
      >
        {tr("OpenCrowdinBtn")}
      </a>
      <p className="crowdin-foot">{tr("CrowdinSourceInfo")}</p>
    </div>
  );
}
