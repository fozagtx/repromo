"use client";

import {useMemo, useRef, useState} from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Spinner,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import ActionCard from "@/components/ui/action-card";
import CenteredNavbar from "@/components/ui/centered-navbar";
import FadeInImage from "@/components/ui/fade-in-image";
import LinkPrompt from "@/components/ui/link-prompt";
import SiteFooter from "@/components/ui/site-footer";

type JobStatus =
  | "pending"
  | "running"
  | "paused"
  | "cancelled"
  | "completed"
  | "failed";

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

const ACTIONS = [
  {
    icon: "solar:magic-stick-3-bold-duotone",
    title: "You vibe coded it",
    description: "Drop the site or repo you just shipped. We take it from there.",
    color: "primary" as const,
  },
  {
    icon: "solar:clapperboard-edit-bold-duotone",
    title: "We make the demo",
    description: "Pitch, scenes, and a short video you can post today.",
    color: "primary" as const,
  },
  {
    icon: "solar:share-circle-bold-duotone",
    title: "Share it anywhere",
    description: "Use it for launches, Twitter, hackathons, and investor updates.",
    color: undefined,
  },
] as const;

const STEPS = ["Read", "Write", "Plan", "Film"] as const;

function normalizeUrl(input: string): string {
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
    return "Reading your project";
  }
  if (raw.includes("complete") || raw.includes("ready")) return "Your video is ready";
  return "Working on your video";
}

function downloadHref(videoUrl: string, filename: string): string {
  const params = new URLSearchParams({
    url: videoUrl,
    filename,
  });
  return `/api/download?${params.toString()}`;
}

export default function Home() {
  const [repoInput, setRepoInput] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const pollAbortRef = useRef<AbortController | null>(null);

  const isActive = useMemo(
    () =>
      isSubmitting ||
      job?.status === "pending" ||
      job?.status === "running" ||
      job?.status === "paused",
    [isSubmitting, job?.status],
  );

  const isRunning = useMemo(
    () => isSubmitting || job?.status === "pending" || job?.status === "running",
    [isSubmitting, job?.status],
  );

  async function pollJob(jobId: string, signal: AbortSignal) {
    for (let attempt = 0; ; attempt++) {
      if (signal.aborted) return;

      const res = await fetch(`/api/jobs/${jobId}`, {cache: "no-store", signal});
      const data = (await res.json()) as Job & {error?: string; message?: string};

      if (!res.ok) {
        const detail =
          data.message || data.error || `Could not check progress (${res.status})`;
        throw new Error(detail);
      }

      setJob(data);
      setError(null);

      if (
        data.status === "completed" ||
        data.status === "failed" ||
        data.status === "cancelled"
      ) {
        if (data.status === "failed" || data.status === "cancelled") {
          setError(data.error || data.message || "Could not make the video");
        }
        setIsSubmitting(false);
        return;
      }

      await new Promise((r) => setTimeout(r, attempt < 2 ? 800 : 2000));
    }
  }

  async function controlJob(action: "pause" | "resume" | "stop") {
    if (!job?.id || job.id === "pending") return;
    setIsControlling(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action}),
      });
      const data = (await res.json()) as Job & {error?: string};
      if (!res.ok) {
        throw new Error(data.error || `Could not ${action}`);
      }
      setJob(data);
      if (action === "stop") {
        pollAbortRef.current?.abort();
        setIsSubmitting(false);
        setError(data.error || "Stopped");
      }
      if (action === "pause") {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update job");
    } finally {
      setIsControlling(false);
    }
  }

  async function startGenerate(link: string) {
    pollAbortRef.current?.abort();
    const abort = new AbortController();
    pollAbortRef.current = abort;

    setError(null);
    setJob({
      id: "pending",
      repoUrl: link,
      status: "pending",
      stage: "queued",
      progress: 2,
      message: "Starting...",
    });
    setIsSubmitting(true);

    try {
      const normalized = normalizeUrl(link);
      if (!normalized.includes(".")) {
        throw new Error("Paste a website or GitHub link");
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url: normalized}),
      });

      const data = (await res.json()) as {jobId?: string; error?: string};
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Could not start. Check your link and try again.");
      }

      setJob((prev) =>
        prev
          ? {...prev, id: data.jobId!, message: "Working on your demo..."}
          : prev,
      );

      await pollJob(data.jobId, abort.signal);
    } catch (err) {
      if (abort.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
      setJob((prev) =>
        prev
          ? {
              ...prev,
              status: "failed",
              stage: "failed",
              error: err instanceof Error ? err.message : "Something went wrong",
            }
          : prev,
      );
    }
  }

  const activeStep = job ? stepIndex(job.stage) : -1;

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-background">
      <div className="relative z-20 px-4 pt-8 sm:px-6">
        <CenteredNavbar />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section
          id="generate"
          className="z-20 flex w-full flex-col items-center justify-center gap-[18px] sm:gap-6"
        >
          <Button
            className="h-9 overflow-hidden border-1 border-default-100 bg-default-50 px-[18px] py-2 text-small font-normal leading-5 text-default-500"
            endContent={
              <Icon
                className="flex-none outline-none [&>path]:stroke-[2]"
                icon="solar:arrow-right-linear"
                width={20}
              />
            }
            radius="full"
            variant="bordered"
          >
            You vibe coded it. We make the video.
          </Button>

          <div className="text-center text-[clamp(40px,10vw,44px)] font-bold leading-[1.2] tracking-tighter sm:text-[64px]">
            <div className="bg-hero-section-title bg-clip-text text-transparent">
              You built the app.
              <br />
              We make the demo.
            </div>
          </div>

          <p className="text-center font-normal leading-7 text-default-500 sm:w-[466px] sm:text-[18px]">
            Paste your website or GitHub repo. Get a short demo video you can
            post the same day.
          </p>
        </section>

        <section className="z-20 mt-8 w-full">
          <LinkPrompt
            value={repoInput}
            onValueChange={setRepoInput}
            onSubmit={() => void startGenerate(repoInput)}
            isLoading={isRunning}
          />
        </section>

        {error && (
          <section className="z-20 mt-4 w-full">
            <ActionCard
              color="danger"
              icon="solar:danger-triangle-bold"
              title="Could not finish"
              description={error}
            />
          </section>
        )}

        {(isActive || job) && (
          <section className="z-20 mt-6 w-full space-y-3">
            <Card className="border-small border-default-200" shadow="sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-0 pt-5">
                <div className="text-left">
                  <p className="text-medium font-medium">
                    {job?.status === "cancelled"
                      ? "Stopped"
                      : job?.status === "failed"
                        ? "Failed"
                        : job?.status === "paused"
                          ? "Paused"
                          : job?.status === "completed"
                            ? "Done"
                            : "Making your video"}
                  </p>
                  <p className="text-small text-default-500">
                    {error && job?.status !== "paused"
                      ? error
                      : friendlyMessage(job?.message, job?.stage)}
                  </p>
                </div>
                {isRunning && <Spinner size="sm" color="default" />}
              </CardHeader>
              <CardBody className="gap-4 px-5 pb-5">
                <Progress
                  aria-label="Progress"
                  value={job?.progress ?? 0}
                  classNames={{
                    indicator: "bg-default-foreground",
                  }}
                  size="sm"
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STEPS.map((label, index) => {
                    const done =
                      job?.status === "completed" ||
                      (activeStep > index &&
                        job?.status !== "failed" &&
                        job?.status !== "cancelled");
                    const current =
                      (job?.status === "running" || job?.status === "paused") &&
                      activeStep === index;
                    return (
                      <div
                        key={label}
                        className={`rounded-medium px-3 py-2.5 text-left text-small ${
                          done
                            ? "bg-default-foreground text-background"
                            : current
                              ? "bg-default-100 text-foreground"
                              : "bg-default-50 text-default-400"
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

                {isActive && job?.id && job.id !== "pending" && (
                  <div className="flex flex-wrap gap-2">
                    {job.status === "paused" ? (
                      <Button
                        size="sm"
                        radius="full"
                        className="bg-default-foreground text-background"
                        isDisabled={isControlling}
                        isLoading={isControlling}
                        startContent={
                          !isControlling ? (
                            <Icon icon="solar:play-bold" width={16} />
                          ) : undefined
                        }
                        onPress={() => void controlJob("resume")}
                      >
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        radius="full"
                        variant="bordered"
                        isDisabled={isControlling || !isRunning}
                        startContent={<Icon icon="solar:pause-bold" width={16} />}
                        onPress={() => void controlJob("pause")}
                      >
                        Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      radius="full"
                      color="danger"
                      variant="flat"
                      isDisabled={isControlling}
                      startContent={<Icon icon="solar:stop-bold" width={16} />}
                      onPress={() => void controlJob("stop")}
                    >
                      Stop
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {job?.status === "completed" && job.result?.primaryVideoUrl && (
              <div className="space-y-3">
                <Card className="overflow-hidden border-small border-default-200" shadow="sm">
                  <CardBody className="gap-3 p-0 pb-4">
                    <video
                      key={job.result.primaryVideoUrl}
                      src={job.result.primaryVideoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="aspect-video w-full bg-black object-cover"
                    />
                    <div className="flex flex-wrap gap-2 px-4">
                      <Button
                        as="a"
                        href={downloadHref(
                          job.result.primaryVideoUrl,
                          "repromo-demo.mp4",
                        )}
                        download="repromo-demo.mp4"
                        size="sm"
                        radius="full"
                        className="bg-default-foreground text-background"
                        startContent={
                          <Icon icon="solar:download-minimalistic-bold" width={16} />
                        }
                      >
                        Download video
                      </Button>
                      {job.result.shots?.map((shot) => (
                        <Button
                          key={`dl-${shot.id}`}
                          as="a"
                          href={downloadHref(
                            shot.videoUrl,
                            `repromo-shot-${shot.id}.mp4`,
                          )}
                          download={`repromo-shot-${shot.id}.mp4`}
                          size="sm"
                          radius="full"
                          variant="bordered"
                          startContent={
                            <Icon icon="solar:download-minimalistic-linear" width={16} />
                          }
                        >
                          Shot {shot.id}
                        </Button>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {job.result.shots && job.result.shots.length > 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {job.result.shots.map((shot) => (
                      <Card
                        key={shot.id}
                        className="border-small border-default-200"
                        shadow="sm"
                      >
                        <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-0 pt-4">
                          <p className="text-small text-default-500">{shot.title}</p>
                          <Button
                            as="a"
                            href={downloadHref(
                              shot.videoUrl,
                              `repromo-shot-${shot.id}.mp4`,
                            )}
                            download={`repromo-shot-${shot.id}.mp4`}
                            size="sm"
                            radius="full"
                            variant="flat"
                            isIconOnly
                            aria-label={`Download ${shot.title}`}
                          >
                            <Icon icon="solar:download-minimalistic-bold" width={16} />
                          </Button>
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
                  <Card className="border-small border-default-200" shadow="sm">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <p className="text-medium font-medium">
                        {job.result.script.title || "Your pitch"}
                      </p>
                    </CardHeader>
                    <CardBody className="px-5 pb-5">
                      <p className="whitespace-pre-wrap text-small leading-relaxed text-default-600">
                        {job.result.script.fullScript}
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        <section
          id="features"
          className="z-20 mt-14 grid w-full gap-3 sm:grid-cols-3"
        >
          {ACTIONS.map((item) => (
            <ActionCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              color={item.color}
            />
          ))}
        </section>

        <SiteFooter />
      </main>

      <div className="pointer-events-none absolute inset-0 top-[-25%] z-0 scale-150 select-none sm:scale-125">
        <FadeInImage
          fill
          priority
          alt=""
          className="object-cover opacity-40"
          src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/backgrounds/bg-gradient.png"
        />
      </div>
    </div>
  );
}
