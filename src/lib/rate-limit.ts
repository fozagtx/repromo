import { neon } from "@neondatabase/serverless";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSec: number;
};

type MemoryBucket = {
  windowStartMs: number;
  hits: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

function sql() {
  const url = databaseUrl();
  if (!url) return null;
  return neon(url);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function floorWindow(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs) * windowMs;
}

async function hitMemory(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = floorWindow(now, windowMs);
  const existing = memoryBuckets.get(key);

  if (!existing || existing.windowStartMs !== windowStartMs) {
    memoryBuckets.set(key, { windowStartMs, hits: 1 });
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: new Date(windowStartMs + windowMs),
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  existing.hits += 1;
  const remaining = Math.max(0, limit - existing.hits);
  const resetAt = new Date(windowStartMs + windowMs);
  const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000));

  return {
    ok: existing.hits <= limit,
    limit,
    remaining,
    resetAt,
    retryAfterSec,
  };
}

async function hitDatabase(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const db = sql();
  if (!db) return hitMemory(key, limit, windowMs);

  const now = Date.now();
  const windowStartMs = floorWindow(now, windowMs);
  const windowStartIso = new Date(windowStartMs).toISOString();

  // Opportunistic cleanup of old windows (best-effort)
  try {
    await db`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 days'`;
  } catch {
    // table may not exist yet in some envs
  }

  const rows = (await db`
    INSERT INTO rate_limits (bucket_key, window_start, hits)
    VALUES (${key}, ${windowStartIso}::timestamptz, 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET hits = rate_limits.hits + 1
    RETURNING hits
  `) as Array<{ hits: number }>;

  const hits = rows[0]?.hits ?? 1;
  const resetAt = new Date(windowStartMs + windowMs);
  const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000));

  return {
    ok: hits <= limit,
    limit,
    remaining: Math.max(0, limit - hits),
    resetAt,
    retryAfterSec,
  };
}

export async function rateLimit(
  request: Request,
  options: {
    name: string;
    limit: number;
    windowMs: number;
  },
): Promise<RateLimitResult> {
  const ip = clientIp(request);
  const key = `${options.name}:${ip}`;

  try {
    return await hitDatabase(key, options.limit, options.windowMs);
  } catch {
    return hitMemory(key, options.limit, options.windowMs);
  }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
    "Retry-After": String(result.retryAfterSec),
  };
}

/** Generate: 3 jobs / hour / IP */
export const GENERATE_LIMIT = {
  name: "generate",
  limit: Number(process.env.RATE_LIMIT_GENERATE ?? 3),
  windowMs: Number(process.env.RATE_LIMIT_GENERATE_WINDOW_MS ?? 60 * 60 * 1000),
};

/** Download: 20 / hour / IP */
export const DOWNLOAD_LIMIT = {
  name: "download",
  limit: Number(process.env.RATE_LIMIT_DOWNLOAD ?? 20),
  windowMs: Number(process.env.RATE_LIMIT_DOWNLOAD_WINDOW_MS ?? 60 * 60 * 1000),
};

/** Job control (pause/stop): 30 / hour / IP */
export const JOB_CONTROL_LIMIT = {
  name: "job-control",
  limit: Number(process.env.RATE_LIMIT_JOB_CONTROL ?? 30),
  windowMs: Number(
    process.env.RATE_LIMIT_JOB_CONTROL_WINDOW_MS ?? 60 * 60 * 1000,
  ),
};
