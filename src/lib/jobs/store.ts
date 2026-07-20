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
  repoUrl: string;
  repoContext: string;
  scout: Record<string, unknown>;
  script: Record<string, unknown>;
  storyboard: Record<string, unknown>;
  shots: GeneratedShot[];
  primaryVideoUrl: string;
}

export interface Job {
  id: string;
  repoUrl: string;
  status: JobStatus;
  stage: string;
  progress: number;
  message?: string;
  error?: string;
  result?: JobResult;
  createdAt: string;
  updatedAt: string;
}

const jobs = new Map<string, Job>();

export function createJob(repoUrl: string): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: uuidv4(),
    repoUrl,
    status: "pending",
    stage: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(
  id: string,
  patch: Partial<Omit<Job, "id" | "createdAt">>,
): Job {
  const existing = jobs.get(id);
  if (!existing) {
    throw new Error(`Job not found: ${id}`);
  }

  const updated: Job = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, updated);
  return updated;
}
