import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/store";

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
