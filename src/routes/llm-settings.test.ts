import { describe, expect, it } from "vitest";
import {
  THINGO_DEFAULT_LLM_MODEL,
  THINGO_LLM_BASE_URL,
} from "#/constants/thingo-llm";
import { shouldPreserveThingoBaseUrlInBasicSave } from "./llm-settings";

describe("Thingo LLM save behavior", () => {
  it("keeps the Thingo endpoint when the basic form saves the preset", () => {
    expect(
      shouldPreserveThingoBaseUrlInBasicSave(
        THINGO_DEFAULT_LLM_MODEL,
        THINGO_LLM_BASE_URL,
      ),
    ).toBe(true);
  });

  it("continues to reset non-Thingo basic-form model changes to provider defaults", () => {
    expect(
      shouldPreserveThingoBaseUrlInBasicSave(
        "openai/gpt-5.6-sol",
        THINGO_LLM_BASE_URL,
      ),
    ).toBe(false);
  });
});
