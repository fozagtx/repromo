import { ChatOpenAI } from "@langchain/openai";

/** Token Plan OpenAI-compatible endpoint (credits) */
const TOKEN_PLAN_COMPAT_BASE_URL =
  "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";

/** Pay-as-you-go DashScope (free tier / card billing) */
const PAYG_COMPAT_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export type QwenBillingMode = "token-plan" | "payg";

export function getQwenBillingMode(): QwenBillingMode {
  const mode = (process.env.QWEN_BILLING_MODE || "token-plan").toLowerCase();
  return mode === "payg" ? "payg" : "token-plan";
}

export function getQwenCompatBaseUrl(): string {
  if (process.env.QWEN_COMPAT_BASE_URL?.trim()) {
    return process.env.QWEN_COMPAT_BASE_URL.trim();
  }
  return getQwenBillingMode() === "payg"
    ? PAYG_COMPAT_BASE_URL
    : TOKEN_PLAN_COMPAT_BASE_URL;
}

/** Token Plan native API host (video tasks, etc.) */
export function getQwenApiBaseUrl(): string {
  if (process.env.QWEN_API_BASE_URL?.trim()) {
    return process.env.QWEN_API_BASE_URL.trim();
  }
  return getQwenBillingMode() === "payg"
    ? "https://dashscope-intl.aliyuncs.com/api/v1"
    : "https://token-plan.ap-southeast-1.maas.aliyuncs.com/api/v1";
}

export function getDashScopeApiKey(): string {
  const apiKey =
    process.env.DASHSCOPE_API_KEY?.trim() ||
    process.env.QWEN_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is required. Set it in .env (see .env.example).",
    );
  }
  return apiKey;
}

export function getQwenModelName(): string {
  if (process.env.QWEN_MODEL?.trim()) return process.env.QWEN_MODEL.trim();
  // Token Plan catalog uses qwen3.7-plus; PAYG often accepts qwen-plus
  return getQwenBillingMode() === "payg" ? "qwen-plus" : "qwen3.7-plus";
}

export function getQwenModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: getQwenModelName(),
    apiKey: getDashScopeApiKey(),
    temperature: 0.7,
    configuration: {
      baseURL: getQwenCompatBaseUrl(),
    },
  });
}
