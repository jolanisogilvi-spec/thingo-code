import { createInstance, type i18n as I18nInstance } from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { buildAgentCanvasPath } from "#/utils/base-path";

// Re-export so library consumers (`@openhands/agent-canvas/i18n`) keep working
// without pulling the 1 MB `translation.json` into the app build. Rollup drops
// this re-export when the consumer does not reference `translationResources`,
// which is the case for the app entry that uses i18next-http-backend.
export { translationResources, type TranslationResources } from "./resources";

export const OPENHANDS_I18N_NAMESPACE = "openhands";

export const AvailableLanguages = [
  { label: "简体中文", value: "zh-CN" },
  { label: "English", value: "en" },
] as const;

export type AvailableLanguage = (typeof AvailableLanguages)[number]["value"];

export const normalizeLanguage = (
  language: string | null | undefined,
): AvailableLanguage =>
  AvailableLanguages.some(({ value }) => value === language)
    ? (language as AvailableLanguage)
    : "zh-CN";

const initializationPromises = new WeakMap<I18nInstance, Promise<unknown>>();

const initializeI18n = (instance: I18nInstance) => {
  if (!initializationPromises.has(instance)) {
    const initPromise = instance
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        lng: "zh-CN",
        fallbackLng: "zh-CN",
        debug: import.meta.env.NODE_ENV === "development",
        supportedLngs: AvailableLanguages.map((lang) => lang.value),
        nonExplicitSupportedLngs: false,
        ns: [OPENHANDS_I18N_NAMESPACE],
        defaultNS: OPENHANDS_I18N_NAMESPACE,
        fallbackNS: OPENHANDS_I18N_NAMESPACE,
        backend: {
          loadPath: buildAgentCanvasPath("/locales/{{lng}}/{{ns}}.json"),
        },
        // React escapes interpolated values at render time; leaving i18next's
        // default escaping on double-escapes them, turning paths like
        // "~/.codex/auth.json" into "~&#x2F;.codex&#x2F;auth.json".
        // Safe to disable globally: every translation renders through React
        // (no dangerouslySetInnerHTML on translated strings), which is the
        // standard react-i18next setup.
        interpolation: {
          escapeValue: false,
        },
      });

    initializationPromises.set(instance, initPromise);
  }

  return instance;
};

export const createAgentServerI18n = () => initializeI18n(createInstance());

let defaultI18n: I18nInstance | null = null;
let activeI18n: I18nInstance | null = null;

export const getDefaultI18n = () => {
  if (!defaultI18n) {
    defaultI18n = createAgentServerI18n();
  }

  return defaultI18n;
};

export const getI18n = () => activeI18n ?? getDefaultI18n();

export const setI18n = (instance?: I18nInstance | null) => {
  activeI18n = instance ?? getDefaultI18n();
  return activeI18n;
};

export const waitForI18n = async (instance = getDefaultI18n()) => {
  await initializationPromises.get(instance);
  return instance;
};

const withNamespace = (options?: unknown) => {
  if (!options) {
    return { ns: OPENHANDS_I18N_NAMESPACE };
  }

  if (typeof options === "object" && !Array.isArray(options)) {
    return {
      ns: OPENHANDS_I18N_NAMESPACE,
      ...(options as Record<string, unknown>),
    };
  }

  return options;
};

const i18n = new Proxy({} as I18nInstance, {
  get: (_target, prop) => {
    const instance = getI18n();

    if (prop === "t") {
      return (key: string, options?: unknown) =>
        instance.t(key, withNamespace(options) as never);
    }

    if (prop === "exists") {
      return (key: string, options?: unknown) =>
        instance.exists(key, withNamespace(options) as never);
    }

    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  set: (_target, prop, value) => {
    const instance = getI18n();
    return Reflect.set(instance, prop, value, instance);
  },
}) as I18nInstance;

export default i18n;
