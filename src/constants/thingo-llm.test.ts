import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "#/services/settings";
import {
  isThingoLlmBaseUrl,
  isThingoLlmConfiguration,
  THINGO_DEFAULT_LLM_MODEL,
  THINGO_LLM_BASE_URL,
  THINGO_LLM_DEFAULT_VALUES,
} from "./thingo-llm";

describe("Thingo LLM preset", () => {
  it("uses DeepSeek V4 Flash through Thingo's OpenAI-compatible endpoint", () => {
    expect(THINGO_DEFAULT_LLM_MODEL).toBe("openai/deepseek-v4-flash");
    expect(THINGO_LLM_BASE_URL).toBe("https://uniapi.thingo.com.cn/v1");
    expect(THINGO_LLM_DEFAULT_VALUES).toEqual({
      "llm.model": THINGO_DEFAULT_LLM_MODEL,
      "llm.base_url": THINGO_LLM_BASE_URL,
    });
  });

  it("is the default only for fresh settings, without supplying an API key", () => {
    expect(DEFAULT_SETTINGS.llm_model).toBe(THINGO_DEFAULT_LLM_MODEL);
    expect(DEFAULT_SETTINGS.llm_base_url).toBe(THINGO_LLM_BASE_URL);
    expect(DEFAULT_SETTINGS.agent_settings?.llm).toMatchObject({
      model: THINGO_DEFAULT_LLM_MODEL,
      base_url: THINGO_LLM_BASE_URL,
    });
    expect(DEFAULT_SETTINGS.llm_api_key).toBeNull();
  });

  it("recognizes the configured endpoint with an optional trailing slash", () => {
    expect(isThingoLlmBaseUrl(`${THINGO_LLM_BASE_URL}/`)).toBe(true);
    expect(
      isThingoLlmConfiguration(THINGO_DEFAULT_LLM_MODEL, THINGO_LLM_BASE_URL),
    ).toBe(true);
    expect(
      isThingoLlmConfiguration("openai/gpt-5.6-sol", THINGO_LLM_BASE_URL),
    ).toBe(false);
  });
});
