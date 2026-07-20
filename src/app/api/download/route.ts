import { NextResponse } from "next/server";
import {
  DOWNLOAD_LIMIT,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit";

const ALLOWED_HOST_SUFFIXES = [
  ".aliyuncs.com",
  ".aliyun.com",
  ".dashscope.aliyuncs.com",
  ".maas.aliyuncs.com",
  ".alicdn.com",
];

function isAllowedVideoUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

function safeFilename(name: string | null): string {
  const base = (name ?? "repromo-demo").replace(/[^\w.-]+/g, "-").slice(0, 80);
  return base.endsWith(".mp4") ? base : `${base}.mp4`;
}

export async function GET(request: Request) {
  const limited = await rateLimit(request, DOWNLOAD_LIMIT);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Too many downloads. Try again in about ${Math.ceil(limited.retryAfterSec / 60)} minutes.`,
      },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("url");
  const filename = safeFilename(searchParams.get("filename"));

  if (!videoUrl || !isAllowedVideoUrl(videoUrl)) {
    return NextResponse.json(
      { error: "Invalid or unsupported video URL" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(videoUrl, {
      headers: { Accept: "video/*,*/*" },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Could not fetch video (${upstream.status})` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "video/mp4";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
