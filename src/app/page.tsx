"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ActionCard from "@/components/design-promax/action-card";
import CenteredNavbar from "@/components/design-promax/centered-navbar";
import RepoPrompt from "@/components/design-promax/repo-prompt";

type JobStatus = "pending" | "running" | "completed" | "failed";

type Job = {
  id: string;
  repoUrl: string;
  status: JobStatus;
  stage: string;
  progress: number;
  message?: string;
  error?: string;
  result?: {
    primaryVideoUrl: string;
    script?: {
      title?: string;
      fullScript?: string;
    };
    storyboard?: {
      shots?: Array<{
        id: number;
        title: string;
        narration: string;
      }>;
    };
    shots?: Array<{
      id: number;
      title: string;
      videoUrl: string;
    }>;
  };
};

const TRY_REPOS = [
  { label: "react", url: "https://github.com/facebook/react" },
  { label: "next.js", url: "https://github.com/vercel/next.js" },
  { label: "tailwindcss", url: "https://github.com/tailwindlabs/tailwindcss" },
] as const;

const ACTIONS = [
  {
    icon: "solar:bolt-bold-duotone",
    title: "Launch faster",
    description: "Turn a GitHub link into a promo you can share the same day.",
  },
  {
    icon: "solar:chat-round-like-bold-duotone",
    title: "Sounds like you",
    description: "Reads your README and writes a clear pitch people get.",
  },
  {
    icon: "solar:videocamera-record-bold-duotone",
    title: "Ready to post",
    description: "Get short scenes plus the script, ready for demos and launches.",
  },
] as const;

const STEPS = ["Read", "Write", "Plan", "Film"] as const;

function normalizeRepoUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function stepIndex(stage: string): number {
  if (stage.includes("script")) return 1;
  if (stage.includes("storyboard")) return 2;
  if (
    stage.includes("generate") ||
    stage.includes("render") ||
    stage === "finalize" ||
    stage === "completed"
  ) {
    return 3;
  }
  if (stage.includes("scout") || stage.includes("parse")) return 0;
  return -1;
}

function friendlyMessage(message?: string, stage?: string): string {
  if (!message && !stage) return "Getting started";
  const raw = `${stage ?? ""} ${message ?? ""}`.toLowerCase();
  if (raw.includes("fail")) return message ?? "Something went wrong";
  if (raw.includes("generate") || raw.includes("render") || raw.includes("shot")) {
    return "Filming your scenes";
  }
  if (raw.includes("storyboard")) return "Planning the scenes";
  if (raw.includes("script")) return "Writing your pitch";
  if (raw.includes("scout") || raw.includes("parse") || raw.includes("fetch")) {
    return "Reading your repository";
  }
  if (raw.includes("complete") || raw.includes("ready")) return "Your video is ready";
  return "Working on your video";
}

export default function Home() {
  const [repoInput, setRepoInput] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRunning = useMemo(
    () => isSubmitting || job?.status === "pending" || job?.status === "running",
    [isSubmitting, job?.status],
  );

  async function pollJob(jobId: string) {
    for (;;) {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Could not check progress. Try again.");
      const data = (await res.json()) as Job;
      setJob(data);

      if (data.status === "completed" || data.status === "failed") {
        if (data.status === "failed") {
          setError(data.error || data.message || "Could not make the video");
        }
        setIsSubmitting(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  async function startGenerate(repoUrl: string) {
    setError(null);
    setJob(null);
    setIsSubmitting(true);

    try {
      const normalized = normalizeRepoUrl(repoUrl);
      if (!normalized.includes("github.com/")) {
        throw new Error("Paste a valid GitHub repository link");
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: normalized }),
      });

      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Could not start. Check your link and try again.");
      }

      await pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  const activeStep = job ? stepIndex(job.stage) : -1;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#F4F4F5]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(15,138,82,0.10),transparent_60%)]" />

      <div className="relative z-20 px-4 pt-5 sm:px-6">
        <CenteredNavbar />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        {/* Status chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Chip
            className="border border-primary/15 bg-primary/10 text-primary"
            size="sm"
            variant="flat"
            startContent={<span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          >
            From repo to launch video
          </Chip>
          <Chip className="border border-default-200 bg-white text-default-600" size="sm" variant="flat">
            No editor needed
          </Chip>
        </div>

        {/* Hero */}
        <section id="generate" className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Ship your project
            <span className="mt-1 block text-zinc-400">with a video</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-500">
            Paste your GitHub link. Get a short promo you can post the same day
            you launch.
          </p>
        </section>

        {/* 3 ActionCards */}
        <section className="grid gap-3 sm:grid-cols-3">
          {ACTIONS.map((item) => (
            <ActionCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              color="primary"
            />
          ))}
        </section>

        {/* Gate / form card */}
        <Card
          id="features"
          className="border border-default-200 bg-white shadow-sm"
          shadow="none"
        >
          <CardBody className="gap-4 p-4 sm:p-5">
            <div className="text-left">
              <p className="text-medium font-medium text-zinc-900">
                Paste a public GitHub repo
              </p>
              <p className="text-small text-zinc-500">
                We read the project, write the pitch, and film the scenes.
              </p>
            </div>

            <RepoPrompt
              value={repoInput}
              onValueChange={setRepoInput}
              onSubmit={() => void startGenerate(repoInput)}
              isLoading={isRunning}
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-tiny text-zinc-400">Try:</span>
              {TRY_REPOS.map((repo) => (
                <Button
                  key={repo.label}
                  size="sm"
                  radius="full"
                  variant="bordered"
                  className="border-default-200 bg-zinc-50"
                  isDisabled={isRunning}
                  onPress={() => setRepoInput(repo.url.replace("https://", ""))}
                >
                  {repo.label}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Progress / result */}
        {(isRunning || job) && (
          <section className="space-y-3">
            <Card className="border border-default-200 bg-white" shadow="none">
              <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-0 pt-5">
                <div className="text-left">
                  <p className="text-medium font-medium">Making your video</p>
                  <p className="text-small text-zinc-500">
                    {friendlyMessage(job?.message, job?.stage)}
                  </p>
                </div>
                {isRunning && <Spinner size="sm" color="primary" />}
              </CardHeader>
              <CardBody className="gap-4 px-5 pb-5">
                <Progress
                  aria-label="Progress"
                  value={job?.progress ?? 0}
                  color="primary"
                  size="sm"
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STEPS.map((label, index) => {
                    const done =
                      job?.status === "completed" ||
                      (activeStep > index && job?.status !== "failed");
                    const current =
                      job?.status === "running" && activeStep === index;
                    return (
                      <div
                        key={label}
                        className={`rounded-xl px-3 py-2.5 text-left text-small ${
                          done
                            ? "bg-primary/10 text-primary"
                            : current
                              ? "bg-zinc-100 text-zinc-900"
                              : "bg-zinc-50 text-zinc-400"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider opacity-70">
                          {index + 1}
                        </div>
                        <div className="font-medium">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {error && (
              <Card className="border border-danger-200 bg-danger-50" shadow="none">
                <CardBody className="flex flex-row items-start gap-3 p-4">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    width={20}
                    className="mt-0.5 text-danger"
                  />
                  <div className="text-left">
                    <p className="text-small font-medium text-danger">Could not finish</p>
                    <p className="text-small text-danger-600">{error}</p>
                  </div>
                </CardBody>
              </Card>
            )}

            {job?.status === "completed" && job.result?.primaryVideoUrl && (
              <div className="space-y-3">
                <Card className="overflow-hidden border border-default-200 bg-white" shadow="none">
                  <CardBody className="p-0">
                    <video
                      key={job.result.primaryVideoUrl}
                      src={job.result.primaryVideoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="aspect-video w-full bg-black object-cover"
                    />
                  </CardBody>
                </Card>

                {job.result.shots && job.result.shots.length > 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {job.result.shots.map((shot) => (
                      <Card
                        key={shot.id}
                        className="border border-default-200 bg-white"
                        shadow="none"
                      >
                        <CardHeader className="px-4 pb-0 pt-4">
                          <p className="text-small text-zinc-500">{shot.title}</p>
                        </CardHeader>
                        <CardBody className="px-4 pb-4">
                          <video
                            src={shot.videoUrl}
                            controls
                            playsInline
                            className="aspect-video w-full rounded-xl bg-black"
                          />
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                {job.result.script?.fullScript && (
                  <Card className="border border-default-200 bg-white" shadow="none">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <p className="text-medium font-medium">
                        {job.result.script.title || "Your pitch"}
                      </p>
                    </CardHeader>
                    <CardBody className="px-5 pb-5">
                      <p className="whitespace-pre-wrap text-small leading-relaxed text-zinc-600">
                        {job.result.script.fullScript}
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        <footer id="contact" className="pt-4 text-center text-tiny text-zinc-400">
          Repromo
        </footer>
      </main>
    </div>
  );
}
