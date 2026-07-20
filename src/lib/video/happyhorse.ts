import { getDashScopeApiKey, getQwenApiBaseUrl } from "@/lib/qwen/client";

const VIDEO_SYNTHESIS_PATH =
  "/services/aigc/video-generation/video-synthesis";

export type VideoTaskStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "UNKNOWN";

export interface CreateVideoTaskOptions {
  prompt: string;
  resolution?: "720P" | "1080P";
  ratio?: "16:9" | "9:16" | "1:1";
  duration?: number;
  model?: string;
}

export interface VideoTaskOutput {
  task_id: string;
  task_status: VideoTaskStatus;
  video_url?: string;
  code?: string;
  message?: string;
}

export interface VideoTaskResponse {
  request_id?: string;
  output: VideoTaskOutput;
}

function getVideoModel(): string {
  if (process.env.DASHSCOPE_VIDEO_MODEL?.trim()) {
    return process.env.DASHSCOPE_VIDEO_MODEL.trim();
  }
  // HappyHorse is Token Plan; PAYG uses Wan text-to-video
  const mode = (process.env.QWEN_BILLING_MODE || "token-plan").toLowerCase();
  return mode === "payg" ? "wan2.6-t2v" : "happyhorse-1.1-t2v";
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getDashScopeApiKey()}`,
    "Content-Type": "application/json",
    "X-DashScope-Async": "enable",
  };
}

export async function createVideoTask(
  options: CreateVideoTaskOptions,
): Promise<VideoTaskResponse> {
  const response = await fetch(
    `${getQwenApiBaseUrl()}${VIDEO_SYNTHESIS_PATH}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        model: options.model ?? getVideoModel(),
        input: { prompt: options.prompt },
        parameters: {
          resolution: options.resolution ?? "720P",
          ratio: options.ratio ?? "16:9",
          duration: options.duration ?? 5,
        },
      }),
    },
  );

  const data = (await response.json()) as VideoTaskResponse & {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ?? data.code ?? `Video task creation failed (${response.status})`,
    );
  }

  if (!data.output?.task_id) {
    throw new Error("Video task creation did not return a task_id");
  }

  return data;
}

export async function getVideoTask(taskId: string): Promise<VideoTaskResponse> {
  const response = await fetch(`${getQwenApiBaseUrl()}/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getDashScopeApiKey()}`,
    },
  });

  const data = (await response.json()) as VideoTaskResponse & {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ?? data.code ?? `Video task query failed (${response.status})`,
    );
  }

  return data;
}

export interface WaitForVideoOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  onStatus?: (status: VideoTaskStatus) => void;
}

export async function waitForVideo(
  taskId: string,
  options: WaitForVideoOptions = {},
): Promise<VideoTaskResponse> {
  const pollIntervalMs = options.pollIntervalMs ?? 10_000;
  const timeoutMs = options.timeoutMs ?? 600_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const task = await getVideoTask(taskId);
    const status = task.output.task_status;
    options.onStatus?.(status);

    if (status === "SUCCEEDED") {
      if (!task.output.video_url) {
        throw new Error(`Video task ${taskId} succeeded but returned no video_url`);
      }
      return task;
    }

    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(
        task.output.message ??
          task.output.code ??
          `Video task ${taskId} ended with status ${status}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Video task ${taskId} timed out after ${timeoutMs}ms`);
}
