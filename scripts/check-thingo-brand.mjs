import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const translations = JSON.parse(
  readFileSync(join(root, "src", "i18n", "translation.json"), "utf8"),
);

const allowedLanguages = new Set(["en", "zh-CN"]);
const technicalTranslationKeys = new Set([
  "SCHEMA$AGENT_CONTEXT$LOAD_MEMORY$DESCRIPTION",
  "AUTH$RECAPTCHA_BLOCKED",
  "COMMAND_MENU$AGENT_SETTINGS_KEYWORDS",
]);
const failures = [];

for (const [key, values] of Object.entries(translations)) {
  const languages = Object.keys(values);
  if (
    languages.length !== allowedLanguages.size ||
    languages.some((language) => !allowedLanguages.has(language))
  ) {
    failures.push(`${key}: expected only en and zh-CN`);
  }

  for (const [language, value] of Object.entries(values)) {
    if (
      !technicalTranslationKeys.has(key) &&
      /OpenHands Agent Canvas|Agent Canvas|OpenHands/i.test(value)
    ) {
      failures.push(`${key}[${language}]: contains legacy product branding`);
    }
  }
}

const requiredFiles = new Map([
  ["src/prompts/thingo-code-identity.md", /Thingo Code[\s\S]*Thingo/],
  ["electron/package.json", /"productName": "Thingo Code"/],
  ["src/root.tsx", /title: "Thingo Code"/],
]);

for (const [relativePath, expected] of requiredFiles) {
  const value = readFileSync(join(root, relativePath), "utf8");
  if (!expected.test(value)) {
    failures.push(`${relativePath}: missing required Thingo Code branding`);
  }
}

if (failures.length > 0) {
  console.error("Thingo Code brand check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Thingo Code brand check passed (${Object.keys(translations).length} bilingual translation keys).`,
);
