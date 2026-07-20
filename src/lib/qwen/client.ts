import { ChatOpenAI } from "@langchain/openai";

const DASHSCOPE_COMPAT_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export function getDashScopeApiKey(): string {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is required. Set it in .env.local (see .env.example).",
    );
  }
  return apiKey;
}

export function getQwenModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: process.env.QWEN_MODEL || "qwen-plus",
    apiKey: getDashScopeApiKey(),
    temperature: 0.7,
    configuration: {
      baseURL: DASHSCOPE_COMPAT_BASE_URL,
    },
  });
}
