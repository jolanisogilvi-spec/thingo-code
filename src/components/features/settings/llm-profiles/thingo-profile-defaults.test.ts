import { describe, expect, it } from "vitest";
import { shouldDropBaseUrlForBasicProfileModelChange } from "./llm-settings-local-view";
import {
  THINGO_DEFAULT_LLM_MODEL,
  THINGO_LLM_BASE_URL,
} from "#/constants/thingo-llm";

describe("Thingo LLM profile defaults", () => {
  it("keeps the Thingo endpoint when a new Basic profile uses its preset", () => {
    expect(
      shouldDropBaseUrlForBasicProfileModelChange(true, {
        model: THINGO_DEFAULT_LLM_MODEL,
        base_url: THINGO_LLM_BASE_URL,
      }),
    ).toBe(false);
  });

  it("still clears a stale endpoint after any other Basic model change", () => {
    expect(
      shouldDropBaseUrlForBasicProfileModelChange(true, {
        model: "anthropic/claude-sonnet-4",
        base_url: THINGO_LLM_BASE_URL,
      }),
    ).toBe(true);
  });
});
