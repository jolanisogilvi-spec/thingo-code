/**
 * Thingo's OpenAI-compatible endpoint is an application preset, not a
 * LiteLLM provider. Keep the stored model on the native `openai/` route so
 * the agent server continues to use its existing OpenAI-compatible adapter.
 */
export const THINGO_LLM_PROVIDER_ID = "thingo";
export const THINGO_LLM_BASE_URL = "https://uniapi.thingo.com.cn/v1";
export const THINGO_DEFAULT_MODEL_ID = "deepseek-v4-flash";
export const THINGO_DEFAULT_LLM_MODEL = `openai/${THINGO_DEFAULT_MODEL_ID}`;

export const THINGO_LLM_DEFAULT_VALUES = {
  "llm.model": THINGO_DEFAULT_LLM_MODEL,
  "llm.base_url": THINGO_LLM_BASE_URL,
} as const;

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.trim().replace(/\/+$/, "");

export const isThingoLlmModel = (model: string | null | undefined) =>
  model?.trim() === THINGO_DEFAULT_LLM_MODEL;

export const isThingoLlmBaseUrl = (baseUrl: string | null | undefined) =>
  normalizeBaseUrl(baseUrl ?? "") === THINGO_LLM_BASE_URL;

export const isThingoLlmConfiguration = (
  model: string | null | undefined,
  baseUrl: string | null | undefined,
) => isThingoLlmModel(model) && isThingoLlmBaseUrl(baseUrl);
