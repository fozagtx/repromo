import { neon } from "@neondatabase/serverless";
import { v4 as uuidv4 } from "uuid";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface GeneratedShot {
  id: number;
  title: string;
  narration: string;
  videoPrompt: string;
  videoUrl: string;
  taskId: string;
}

export interface JobResult {
  sourceUrl: string;
  sourceKind: "github" | "website";
  projectContext: string;
  scout: Record<string, unknown>;
  script: Record<string, unknown>;
  storyboard: Record<string, unknown>;
  shots: GeneratedShot[];
  primaryVideoUrl: string;
}

export interface Job {
  id: string;
  /** @deprecated use sourceUrl */
  repoUrl: string;
  sourceUrl: string;
  status: JobStatus;
  stage: string;
  progress: number;
  message?: string;
  error?: string;
  result?: JobResult;
  createdAt: string;
  updatedAt: string;
}

type JobRow = {
  id: string;
  repo_url: string;
  source_url: string;
  status: JobStatus;
  stage: string;
  progress: number;
  message: string | null;
  error: string | null;
  result: JobResult | null;
  created_at: string;
  updated_at: string;
};

const memoryJobs = new Map<string, Job>();

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

function sql() {
  const url = databaseUrl();
  if (!url) return null;
  return neon(url);
}

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    repoUrl: row.repo_url,
    sourceUrl: row.source_url,
    status: row.status,
    stage: row.stage,
    progress: row.progress,
    message: row.message ?? undefined,
    error: row.error ?? undefined,
    result: row.result ?? undefined,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(row.updated_at).toISOString(),
  };
}

export async function createJob(sourceUrl: string): Promise<Job> {
  const now = new Date().toISOString();
  const job: Job = {
    id: uuidv4(),
    repoUrl: sourceUrl,
    sourceUrl,
    status: "pending",
    stage: "queued",
    progress: 0,
    message: "Queued",
    createdAt: now,
    updatedAt: now,
  };

  memoryJobs.set(job.id, job);

  const db = sql();
  if (db) {
    await db`
      INSERT INTO jobs (
        id, repo_url, source_url, status, stage, progress, message, created_at, updated_at
      ) VALUES (
        ${job.id},
        ${job.repoUrl},
        ${job.sourceUrl},
        ${job.status},
        ${job.stage},
        ${job.progress},
        ${job.message ?? null},
        ${job.createdAt},
        ${job.updatedAt}
      )
    `;
  }

  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const db = sql();
  if (db) {
    const rows = (await db`
      SELECT
        id, repo_url, source_url, status, stage, progress,
        message, error, result, created_at, updated_at
      FROM jobs
      WHERE id = ${id}
      LIMIT 1
    `) as JobRow[];

    if (rows[0]) {
      const job = rowToJob(rows[0]);
      memoryJobs.set(job.id, job);
      return job;
    }
  }

  return memoryJobs.get(id);
}

export async function updateJob(
  id: string,
  patch: Partial<Omit<Job, "id" | "createdAt">>,
): Promise<Job> {
  const existing = (await getJob(id)) ?? memoryJobs.get(id);
  if (!existing) {
    throw new Error(`Job not found: ${id}`);
  }

  const updated: Job = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  memoryJobs.set(id, updated);

  const db = sql();
  if (db) {
    await db`
      UPDATE jobs SET
        repo_url = ${updated.repoUrl},
        source_url = ${updated.sourceUrl},
        status = ${updated.status},
        stage = ${updated.stage},
        progress = ${updated.progress},
        message = ${updated.message ?? null},
        error = ${updated.error ?? null},
        result = ${updated.result ? JSON.stringify(updated.result) : null}::jsonb,
        updated_at = ${updated.updatedAt}
      WHERE id = ${id}
    `;
  }

  return updated;
}
