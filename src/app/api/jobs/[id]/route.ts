import { NextResponse } from "next/server";
import {
  cancelJob,
  getJob,
  pauseJob,
  resumeJob,
} from "@/lib/jobs/store";
import {
  JOB_CONTROL_LIMIT,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json(
        {
          error: "Job not found",
          message:
            "This job is gone or never saved. Start a new generate and keep this tab open.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = await rateLimit(request, JOB_CONTROL_LIMIT);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Too many control requests. Try again in about ${Math.ceil(limited.retryAfterSec / 60)} minutes.`,
      },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const { id } = await context.params;

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action?.trim().toLowerCase();
  if (action !== "pause" && action !== "resume" && action !== "stop") {
    return NextResponse.json(
      { error: "Use action: pause, resume, or stop" },
      { status: 400 },
    );
  }

  try {
    if (action === "pause") {
      return NextResponse.json(await pauseJob(id));
    }
    if (action === "resume") {
      return NextResponse.json(await resumeJob(id));
    }
    return NextResponse.json(await cancelJob(id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update job";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
