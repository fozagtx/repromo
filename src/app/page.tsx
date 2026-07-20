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
import CenteredNavbar from "@/components/design-promax/centered-navbar";
import FeatureCard from "@/components/design-promax/feature-card";
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

const FEATURES = [
  {
    key: "fast",
    title: "Launch faster",
    icon: <Icon className="text-primary" icon="solar:bolt-bold-duotone" width={40} />,
    descriptions: [
      "Go from a GitHub link to a shareable promo video",
      "Skip hiring an editor for your first launch cut",
      "Use it the same day you open-source or ship",
    ],
  },
  {
    key: "clear",
    title: "Sounds like your product",
    icon: (
      <Icon className="text-primary" icon="solar:chat-round-like-bold-duotone" width={40} />
    ),
    descriptions: [
      "Reads your README to learn what you built",
      "Writes a short pitch people can follow",
      "Keeps the story simple for Twitter, LinkedIn, and demos",
    ],
  },
  {
    key: "ready",
    title: "Looks ready to post",
    icon: (
      <Icon
        className="text-primary"
        icon="solar:videocamera-record-bold-duotone"
        width={40}
      />
    ),
    descriptions: [
      "Gets multiple short scenes, not one rough clip",
      "Comes with the script so you can tweak the message",
      "Export-ready for launches, hackathons, and updates",
    ],
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
  if (!message && !stage) return "Getting started with your repo";
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
      if (!res.ok) throw new Error("Failed to fetch job status");
      const data = (await res.json()) as Job;
      setJob(data);

      if (data.status === "completed" || data.status === "failed") {
        if (data.status === "failed") {
          setError(data.error || data.message || "Generation failed");
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
        throw new Error("Enter a valid GitHub repository URL");
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: normalized }),
      });

      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Failed to start generation");
      }

      await pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  const activeStep = job ? stepIndex(job.stage) : -1;

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,138,82,0.08),transparent_50%)]" />

      <div className="relative z-20 px-3 pt-6">
        <CenteredNavbar />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-20 pt-16 sm:px-6">
        <section
          id="generate"
          className="flex w-full max-w-2xl flex-col items-center gap-6 text-center"
        >
          <Chip
            className="border border-primary/20 bg-primary/10 text-primary"
            startContent={
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
            }
            variant="flat"
          >
            From repo link to launch video
          </Chip>

          <div className="space-y-3">
            <h1 className="text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
              <span className="block text-foreground">Ship your project</span>
              <span className="mt-1 block text-default-500">with a video</span>
            </h1>
            <p className="mx-auto max-w-md text-default-500 sm:text-large">
              Paste your GitHub link. Get a short promo you can post the same day
              you launch.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-default-200 bg-content1 p-2 shadow-small">
            <RepoPrompt
              value={repoInput}
              onValueChange={setRepoInput}
              onSubmit={() => void startGenerate(repoInput)}
              isLoading={isRunning}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-small text-default-500">Try a public repo:</span>
            {TRY_REPOS.map((repo) => (
              <Button
                key={repo.label}
                size="sm"
                radius="full"
                variant="bordered"
                className="border-default-200 bg-content1"
                isDisabled={isRunning}
                onPress={() => setRepoInput(repo.url.replace("https://", ""))}
              >
                {repo.label}
              </Button>
            ))}
          </div>
        </section>

        <section id="features" className="mt-24 w-full">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Why founders use Repromo
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-default-500">
              Stop explaining your project in a wall of text. Show people what it
              does in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((category) => (
              <FeatureCard
                key={category.key}
                descriptions={[...category.descriptions]}
                icon={category.icon}
                title={category.title}
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              className="font-medium"
              color="primary"
              radius="full"
              size="lg"
              isDisabled={isRunning || !repoInput.trim()}
              isLoading={isRunning}
              startContent={
                !isRunning ? (
                  <Icon icon="solar:stars-bold" width={18} />
                ) : undefined
              }
              onPress={() => void startGenerate(repoInput)}
            >
              {isRunning ? "Making your video" : "Make my video"}
            </Button>
          </div>
        </section>

        {(isRunning || job) && (
          <section className="mt-16 w-full max-w-2xl space-y-4">
            <Card className="border border-default-200 bg-content1" shadow="sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pb-0 pt-5">
                <div className="text-left">
                  <p className="text-medium font-medium">Your video is in progress</p>
                  <p className="text-small text-default-500">
                    {friendlyMessage(job?.message, job?.stage)}
                  </p>
                </div>
                {isRunning && <Spinner size="sm" color="primary" />}
              </CardHeader>
              <CardBody className="gap-4 px-5 pb-5">
                <Progress
                  aria-label="Generation progress"
                  value={job?.progress ?? 0}
                  className="max-w-full"
                  color="primary"
                  size="sm"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {STEPS.map((label, index) => {
                    const done =
                      job?.status === "completed" ||
                      (activeStep > index && job?.status !== "failed");
                    const current =
                      job?.status === "running" && activeStep === index;
                    return (
                      <div
                        key={label}
                        className={`rounded-medium px-3 py-3 text-left text-small ${
                          done
                            ? "bg-primary/10 text-primary"
                            : current
                              ? "bg-default-100 text-foreground"
                              : "bg-default-50 text-default-400"
                        }`}
                      >
                        <div className="text-tiny uppercase tracking-wider opacity-70">
                          Step {index + 1}
                        </div>
                        <div className="mt-1 font-medium">{label}</div>
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
                  <p className="text-small text-danger">{error}</p>
                </CardBody>
              </Card>
            )}

            {job?.status === "completed" && job.result?.primaryVideoUrl && (
              <div className="space-y-4">
                <Card className="overflow-hidden border border-default-200" shadow="sm">
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    {job.result.shots.map((shot) => (
                      <Card
                        key={shot.id}
                        className="border border-default-200 bg-content1"
                        shadow="sm"
                      >
                        <CardHeader className="px-4 pb-0 pt-4">
                          <p className="text-small text-default-500">{shot.title}</p>
                        </CardHeader>
                        <CardBody className="px-4 pb-4">
                          <video
                            src={shot.videoUrl}
                            controls
                            playsInline
                            className="aspect-video w-full rounded-medium bg-black"
                          />
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                {job.result.script?.fullScript && (
                  <Card className="border border-default-200 bg-content1" shadow="sm">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <p className="text-medium font-medium">
                        {job.result.script.title || "Your pitch"}
                      </p>
                    </CardHeader>
                    <CardBody className="px-5 pb-5">
                      <p className="whitespace-pre-wrap text-small text-default-600">
                        {job.result.script.fullScript}
                      </p>
                    </CardBody>
                  </Card>
                )}

                {job.result.storyboard?.shots && (
                  <Card className="border border-default-200 bg-content1" shadow="sm">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <p className="text-medium font-medium">Scene breakdown</p>
                    </CardHeader>
                    <CardBody className="gap-4 px-5 pb-5">
                      {job.result.storyboard.shots.map((shot) => (
                        <div key={shot.id} className="text-left text-small">
                          <p className="font-medium text-foreground">{shot.title}</p>
                          <p className="mt-1 text-default-600">{shot.narration}</p>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        <footer
          id="contact"
          className="mt-20 text-center text-tiny text-default-400"
        >
          Repromo · Turn your repo into a launch video
        </footer>
      </main>
    </div>
  );
}
