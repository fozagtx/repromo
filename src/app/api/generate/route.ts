import { after, NextResponse } from "next/server";
import { runShowrunner } from "@/lib/agents/showrunner-graph";
import { createJob, updateJob } from "@/lib/jobs/store";
import { normalizeSourceUrl } from "@/lib/source/fetch-source";

export const maxDuration = 300;

export async function POST(request: Request) {
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

  const job = createJob(sourceUrl);

  after(async () => {
    try {
      updateJob(job.id, {
        status: "running",
        stage: "starting",
        progress: 0,
        message: "Starting on your demo video",
      });

      const result = await runShowrunner(sourceUrl, (update) => {
        updateJob(job.id, {
          status: "running",
          stage: update.stage,
          progress: update.progress,
          message: update.message,
        });
      });

      updateJob(job.id, {
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
      const message =
        error instanceof Error ? error.message : "Unknown showrunner error";
      updateJob(job.id, {
        status: "failed",
        stage: "failed",
        error: message,
        message,
      });
    }
  });

  return NextResponse.json({ jobId: job.id });
}
