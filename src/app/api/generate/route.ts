import { after, NextResponse } from "next/server";
import { runShowrunner } from "@/lib/agents/showrunner-graph";
import { createJob, updateJob } from "@/lib/jobs/store";

export const maxDuration = 300;

export async function POST(request: Request) {
  let body: { repoUrl?: string };
  try {
    body = (await request.json()) as { repoUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const repoUrl = body.repoUrl?.trim();
  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  const job = createJob(repoUrl);

  after(async () => {
    try {
      updateJob(job.id, {
        status: "running",
        stage: "starting",
        progress: 0,
        message: "Starting showrunner pipeline",
      });

      const result = await runShowrunner(repoUrl, (update) => {
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
        message: "Promo video ready",
        result: {
          repoUrl: result.repoUrl,
          repoContext: result.repoContext.rawContext,
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
