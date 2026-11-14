/**
 * Minimal i18n. Files in `./locales/*.json` are the source strings.
 * Crowdin syncs them — see crowdin.yml at the repo root.
 */
import en from "./locales/en.json" with { type: "json" };
import zhHant from "./locales/zh-Hant.json" with { type: "json" };
import zhHans from "./locales/zh-Hans.json" with { type: "json" };
import ar from "./locales/ar.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };
import ko from "./locales/ko.json" with { type: "json" };
import ru from "./locales/ru.json" with { type: "json" };

export type UiLang = "en" | "zh-Hant" | "zh-Hans" | "ar" | "ja" | "ko" | "ru";

export const UI_LANGUAGES: { code: UiLang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
  { code: "zh-Hant", label: "Chinese Traditional", native: "繁" },
  { code: "zh-Hans", label: "Chinese Simplified", native: "简" },
  { code: "ar", label: "Arabic", native: "ع" },
  { code: "ja", label: "Japanese", native: "あ" },
  { code: "ko", label: "Korean", native: "한" },
  { code: "ru", label: "Russian", native: "RU" },
];

export const dicts: Record<UiLang, Record<string, string>> = {
  en: en as Record<string, string>,
  "zh-Hant": zhHant as Record<string, string>,
  "zh-Hans": zhHans as Record<string, string>,
  ar: ar as Record<string, string>,
  ja: ja as Record<string, string>,
  ko: ko as Record<string, string>,
  ru: ru as Record<string, string>,
};

export function t(lang: UiLang, key: string): string {
  return dicts[lang]?.[key] ?? dicts.en[key] ?? key;
}
