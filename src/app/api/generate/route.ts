import { after, NextResponse } from "next/server";
import { runShowrunner } from "@/lib/agents/showrunner-graph";
import {
  JobControlError,
  createJob,
  getJob,
  updateJob,
  waitWhileJobRunnable,
} from "@/lib/jobs/store";
import {
  GENERATE_LIMIT,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { normalizeSourceUrl } from "@/lib/source/fetch-source";

export const maxDuration = 300;

export async function POST(request: Request) {
  const limited = await rateLimit(request, GENERATE_LIMIT);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Too many generate requests. Try again in about ${Math.ceil(limited.retryAfterSec / 60)} minutes.`,
      },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  let body: { url?: string; repoUrl?: string };
  try {
    body = (await request.json()) as { url?: string; repoUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = (body.url ?? body.repoUrl)?.trim();
  if (!raw) {
    return NextResponse.json(
      { error: "Paste a GitHub repo or website link" },
      { status: 400 },
    );
  }

  let sourceUrl: string;
  try {
    sourceUrl = normalizeSourceUrl(raw);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Paste a GitHub repo or website link",
      },
      { status: 400 },
    );
  }

  if (
    !process.env.DASHSCOPE_API_KEY?.trim() &&
    !process.env.QWEN_API_KEY?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "DashScope API key is not configured. Set DASHSCOPE_API_KEY on the server.",
      },
      { status: 500 },
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "Database is not configured. Jobs cannot be tracked on this server.",
      },
      { status: 500 },
    );
  }

  let job;
  try {
    job = await createJob(sourceUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  after(async () => {
    try {
      await waitWhileJobRunnable(job.id);

      await updateJob(job.id, {
        status: "running",
        stage: "starting",
        progress: 0,
        message: "Starting on your demo video",
      });

      const result = await runShowrunner(sourceUrl, async (update) => {
        await waitWhileJobRunnable(job.id);
        await updateJob(job.id, {
          status: "running",
          stage: update.stage,
          progress: update.progress,
          message: update.message,
        });
      });

      await waitWhileJobRunnable(job.id);

      await updateJob(job.id, {
        status: "completed",
        stage: "completed",
        progress: 100,
        message: "Your demo video is ready",
        result: {
          sourceUrl: result.sourceUrl,
          sourceKind: result.projectContext.kind,
          projectContext: result.projectContext.rawContext,
          scout: result.scout,
          script: result.script,
          storyboard: result.storyboard,
          shots: result.shots,
          primaryVideoUrl: result.primaryVideoUrl,
        },
      });
    } catch (error) {
      const current = await getJob(job.id);
      if (current?.status === "cancelled") return;

      if (error instanceof JobControlError && error.status === "cancelled") {
        try {
          await updateJob(job.id, {
            status: "cancelled",
            stage: "cancelled",
            error: "Stopped by you",
            message: "Stopped",
          });
        } catch {
          // ignore
        }
        return;
      }

      const message =
        error instanceof Error ? error.message : "Unknown showrunner error";
      try {
        await updateJob(job.id, {
          status: "failed",
          stage: "failed",
          error: message,
          message,
        });
      } catch {
        // Job row missing - nothing else to do
      }
    }
  });

  return NextResponse.json({ jobId: job.id });
}
