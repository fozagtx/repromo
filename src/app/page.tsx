"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Button, Card, Chip, Input, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ActionCard } from "@/components/action-card";
import { FeatureStatCard } from "@/components/feature-stat-card";

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
      hook?: string;
      problem?: string;
      solution?: string;
      cta?: string;
    };
    storyboard?: {
      shots?: Array<{
        id: number;
        title: string;
        narration: string;
        videoPrompt: string;
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

const PIPELINE = [
  {
    key: "scout",
    title: "Scout the repo",
    description: "Pull README and stack signals into a tight brief.",
    icon: "solar:magnifer-bold-duotone",
  },
  {
    key: "script",
    title: "Write the script",
    description: "Hook, problem, product, and CTA in one short narration.",
    icon: "solar:pen-new-square-bold-duotone",
  },
  {
    key: "storyboard",
    title: "Storyboard shots",
    description: "Break the pitch into cinematic HappyHorse prompts.",
    icon: "solar:clapperboard-edit-bold-duotone",
  },
] as const;

const FEATURES = [
  {
    num: "01",
    label: "SPEED",
    value: "Agentic",
    description:
      "Paste a GitHub URL and the showrunner runs scout, script, storyboard, and render without hand-holding.",
    icon: "solar:bolt-bold-duotone",
  },
  {
    num: "02",
    label: "QUALITY",
    value: "1080p",
    description:
      "Cinematic HappyHorse and Wan exports ready for launch posts, demos, and Devpost.",
    icon: "solar:videocamera-record-bold-duotone",
  },
  {
    num: "03",
    label: "AI-POWERED",
    value: "Qwen",
    description:
      "Qwen Cloud agents write the pitch and shot list from your real repository context.",
    icon: "solar:magic-stick-3-bold-duotone",
  },
  {
    num: "04",
    label: "SCENES",
    value: "2+",
    description:
      "Multi-shot storyboard with intro energy, product highlight, and a clear CTA beat.",
    icon: "solar:gallery-wide-bold-duotone",
  },
  {
    num: "05",
    label: "RENDERING",
    value: "HappyHorse",
    description:
      "Live DashScope video synthesis with async task polling. Real clips only.",
    icon: "solar:play-circle-bold-duotone",
  },
  {
    num: "06",
    label: "BUILT WITH",
    value: "LangGraph",
    description:
      "Production-style multi-agent orchestration on Next.js and Qwen Cloud.",
    icon: "solar:structure-bold-duotone",
  },
] as const;

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
      if (!res.ok) {
        throw new Error("Failed to fetch job status");
      }
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void startGenerate(repoInput);
  }

  const activeStep = job ? stepIndex(job.stage) : -1;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,138,82,0.12),transparent_50%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-20 pt-5 sm:px-6">
        <nav className="mx-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#0e0e0e]/95 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white text-black">
              <Icon icon="solar:play-bold" width={12} />
            </span>
            Ship-Video
          </Link>
          <a
            href="#features"
            className="rounded-full px-3.5 py-1.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Features
          </a>
          <a
            href="#contact"
            className="rounded-full px-3.5 py-1.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Contact
          </a>
        </nav>

        {/* Hero */}
        <section className="mx-auto mt-10 flex w-full max-w-2xl flex-col items-center gap-6 text-center sm:mt-14">
          <Chip color="success" variant="soft" className="border border-emerald-400/20">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <Chip.Label>AI-Powered Video Generation</Chip.Label>
          </Chip>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-white">Ship your project</span>
              <span className="mt-1 block text-white/45">with a video</span>
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
              Transform your GitHub repository into a professional promotional
              video in seconds.
            </p>
          </div>

          {/* Gate / form card */}
          <Card className="w-full border border-white/10 bg-[#141414] shadow-none">
            <Card.Content className="p-2">
              <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <Icon
                    icon="mdi:github"
                    width={20}
                    className="shrink-0 text-white/70"
                  />
                  <Input
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="github.com/username/repository"
                    className="w-full border-0 bg-transparent shadow-none outline-none"
                    disabled={isRunning}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="ship-cta shrink-0 rounded-full bg-white px-5 text-black"
                  isDisabled={isRunning || !repoInput.trim()}
                  isPending={isRunning}
                >
                  {!isRunning && (
                    <Icon icon="solar:stars-bold" width={16} data-icon="leading" />
                  )}
                  {isRunning ? "Generating" : "Generate"}
                </Button>
              </form>
            </Card.Content>
          </Card>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/40">Try:</span>
            {TRY_REPOS.map((repo) => (
              <Button
                key={repo.label}
                size="sm"
                variant="outline"
                className="rounded-full border-white/10 text-white/70"
                isDisabled={isRunning}
                onPress={() => setRepoInput(repo.url.replace("https://", ""))}
              >
                {repo.label}
              </Button>
            ))}
          </div>
        </section>

        {/* 3 ActionCards */}
        <section className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {PIPELINE.map((item) => (
            <ActionCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto mt-10 w-full max-w-4xl border-t border-white/10 pt-14 text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to ship?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/50 sm:text-base">
            Transform your GitHub repository into a stunning promotional video
            in minutes.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureStatCard key={feature.num} {...feature} />
            ))}
          </div>

          <Button
            variant="primary"
            className="ship-cta mt-10 rounded-full bg-white px-7 text-black"
            isDisabled={isRunning || !repoInput.trim()}
            isPending={isRunning}
            onPress={() => void startGenerate(repoInput)}
          >
            {!isRunning && (
              <Icon icon="solar:stars-bold" width={16} data-icon="leading" />
            )}
            {isRunning ? "Generating" : "Generate"}
          </Button>
        </section>

        {/* Pipeline gate / results */}
        {(isRunning || job) && (
          <section id="pipeline" className="mx-auto w-full max-w-2xl space-y-4">
            <Card className="border border-white/10 bg-white/[0.03] shadow-none">
              <Card.Header className="flex flex-row items-center justify-between px-5 pt-5">
                <div>
                  <Card.Title className="text-base text-white">
                    Production pipeline
                  </Card.Title>
                  <Card.Description className="text-white/45">
                    {job?.message || "Starting showrunner"}
                  </Card.Description>
                </div>
                {job && (
                  <Chip size="sm" variant="soft" className="text-white/70">
                    <Chip.Label>
                      {job.progress}% · {job.stage}
                    </Chip.Label>
                  </Chip>
                )}
              </Card.Header>
              <Card.Content className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
                {["Scout", "Script", "Storyboard", "Render"].map((label, index) => {
                  const done =
                    job?.status === "completed" ||
                    (activeStep > index && job?.status !== "failed");
                  const current =
                    job?.status === "running" && activeStep === index;
                  return (
                    <div
                      key={label}
                      className={`rounded-xl border px-3 py-3 text-left text-sm ${
                        done
                          ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200"
                          : current
                            ? "border-white/25 bg-white/[0.06] text-white"
                            : "border-white/10 bg-black/40 text-white/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-70">
                        {current && <Spinner size="sm" />}
                        Step {index + 1}
                      </div>
                      <div className="mt-1 font-medium">{label}</div>
                    </div>
                  );
                })}
              </Card.Content>
            </Card>

            {error && (
              <Card className="border border-red-500/30 bg-red-500/10 shadow-none">
                <Card.Content className="flex items-start gap-3 p-4">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    width={20}
                    className="mt-0.5 text-red-300"
                  />
                  <p className="text-sm text-red-200">{error}</p>
                </Card.Content>
              </Card>
            )}

            {job?.status === "completed" && job.result?.primaryVideoUrl && (
              <div className="space-y-4">
                <Card className="overflow-hidden border border-white/10 bg-black shadow-none">
                  <Card.Content className="p-0">
                    <video
                      key={job.result.primaryVideoUrl}
                      src={job.result.primaryVideoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  </Card.Content>
                </Card>

                {job.result.shots && job.result.shots.length > 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {job.result.shots.map((shot) => (
                      <Card
                        key={shot.id}
                        className="border border-white/10 bg-white/[0.03] shadow-none"
                      >
                        <Card.Header className="px-4 pt-4">
                          <Card.Title className="text-sm text-white/80">
                            {shot.title}
                          </Card.Title>
                        </Card.Header>
                        <Card.Content className="px-4 pb-4">
                          <video
                            src={shot.videoUrl}
                            controls
                            playsInline
                            className="aspect-video w-full rounded-xl bg-black"
                          />
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                )}

                {job.result.script?.fullScript && (
                  <Card className="border border-white/10 bg-white/[0.03] shadow-none">
                    <Card.Header className="px-5 pt-5">
                      <Card.Title className="text-base text-white/90">
                        {job.result.script.title || "Script"}
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="px-5 pb-5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/55">
                        {job.result.script.fullScript}
                      </p>
                    </Card.Content>
                  </Card>
                )}

                {job.result.storyboard?.shots && (
                  <Card className="border border-white/10 bg-white/[0.03] shadow-none">
                    <Card.Header className="px-5 pt-5">
                      <Card.Title className="text-base text-white/90">
                        Storyboard
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4 px-5 pb-5">
                      {job.result.storyboard.shots.map((shot) => (
                        <div key={shot.id} className="text-left text-sm text-white/55">
                          <div className="font-medium text-white/80">{shot.title}</div>
                          <p className="mt-1">{shot.narration}</p>
                        </div>
                      ))}
                    </Card.Content>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        <footer
          id="contact"
          className="mt-auto pt-10 text-center text-xs text-white/30"
        >
          Ship-Video · Powered by Qwen Cloud
        </footer>
      </div>
    </main>
  );
}
