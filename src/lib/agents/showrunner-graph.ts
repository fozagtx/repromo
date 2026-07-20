import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { fetchRepoContext, type RepoContext } from "@/lib/github/fetch-repo";
import { getQwenModel } from "@/lib/qwen/client";
import {
  createVideoTask,
  waitForVideo,
  type VideoTaskStatus,
} from "@/lib/video/happyhorse";
import {
  ScoutOutputSchema,
  ScriptOutputSchema,
  StoryboardOutputSchema,
  type ScoutOutput,
  type ScriptOutput,
  type StoryboardOutput,
  type StoryboardShot,
} from "@/lib/agents/types";

export interface GeneratedShotResult {
  id: number;
  title: string;
  narration: string;
  videoPrompt: string;
  videoUrl: string;
  taskId: string;
}

export interface ShowrunnerResult {
  repoUrl: string;
  repoContext: RepoContext;
  scout: ScoutOutput;
  script: ScriptOutput;
  storyboard: StoryboardOutput;
  shots: GeneratedShotResult[];
  primaryVideoUrl: string;
}

export interface ShowrunnerProgress {
  stage: string;
  progress: number;
  message?: string;
}

const ShowrunnerState = Annotation.Root({
  repoUrl: Annotation<string>,
  repoContext: Annotation<RepoContext | null>,
  scout: Annotation<ScoutOutput | null>,
  script: Annotation<ScriptOutput | null>,
  storyboard: Annotation<StoryboardOutput | null>,
  shots: Annotation<GeneratedShotResult[]>,
  primaryVideoUrl: Annotation<string | null>,
  stage: Annotation<string>,
  progress: Annotation<number>,
  message: Annotation<string | null>,
});

type ShowrunnerStateType = typeof ShowrunnerState.State;

function reportProgress(
  onProgress: ShowrunnerProgressCallback | undefined,
  update: ShowrunnerProgress,
): Partial<ShowrunnerStateType> {
  onProgress?.(update);
  return {
    stage: update.stage,
    progress: update.progress,
    message: update.message ?? null,
  };
}

async function parseRepoNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  const progress = reportProgress(onProgress, {
    stage: "parse_repo",
    progress: 5,
    message: "Fetching repository context from GitHub",
  });

  const repoContext = await fetchRepoContext(state.repoUrl);

  return {
    ...progress,
    repoContext,
    ...reportProgress(onProgress, {
      stage: "parse_repo",
      progress: 10,
      message: `Loaded ${repoContext.owner}/${repoContext.repo}`,
    }),
  };
}

async function scoutNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.repoContext) {
    throw new Error("Repository context missing before scout step");
  }

  reportProgress(onProgress, {
    stage: "scout",
    progress: 15,
    message: "Scouting product positioning with Qwen",
  });

  const model = getQwenModel().withStructuredOutput(ScoutOutputSchema);
  const scout = await model.invoke([
    {
      role: "system",
      content:
        "You are a product marketing scout. Analyze the GitHub repository and extract concise positioning for a short promo video. Keep outputs token-efficient.",
    },
    {
      role: "user",
      content: state.repoContext.rawContext,
    },
  ]);

  return {
    scout,
    ...reportProgress(onProgress, {
      stage: "scout",
      progress: 25,
      message: `Scouted ${scout.productName}`,
    }),
  };
}

async function scriptNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.scout || !state.repoContext) {
    throw new Error("Scout output missing before script step");
  }

  reportProgress(onProgress, {
    stage: "script",
    progress: 30,
    message: "Writing promo script with Qwen",
  });

  const model = getQwenModel().withStructuredOutput(ScriptOutputSchema);
  const script = await model.invoke([
    {
      role: "system",
      content:
        "You are a promo video scriptwriter. Write a tight 15-30 second script with a strong hook and clear CTA. Output must fit a developer tool promo.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          repository: `${state.repoContext.owner}/${state.repoContext.repo}`,
          scout: state.scout,
        },
        null,
        2,
      ),
    },
  ]);

  return {
    script,
    ...reportProgress(onProgress, {
      stage: "script",
      progress: 40,
      message: "Script draft complete",
    }),
  };
}

async function storyboardNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.script || !state.scout) {
    throw new Error("Script output missing before storyboard step");
  }

  reportProgress(onProgress, {
    stage: "storyboard",
    progress: 45,
    message: "Storyboarding shots with Qwen",
  });

  const model = getQwenModel().withStructuredOutput(StoryboardOutputSchema);
  const storyboard = await model.invoke([
    {
      role: "system",
      content:
        "You are a storyboard artist for AI-generated promo videos. Break the script into exactly 2 shots. Each videoPrompt must be vivid, cinematic, and suitable for text-to-video (HappyHorse). Avoid text overlays in prompts.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          scout: state.scout,
          script: state.script,
        },
        null,
        2,
      ),
    },
  ]);

  return {
    storyboard,
    ...reportProgress(onProgress, {
      stage: "storyboard",
      progress: 55,
      message: `Storyboarded ${storyboard.shots.length} shots`,
    }),
  };
}

async function generateShotsNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.storyboard) {
    throw new Error("Storyboard missing before generate_shots step");
  }

  const shots: GeneratedShotResult[] = [];
  const totalShots = state.storyboard.shots.length;

  for (let index = 0; index < totalShots; index++) {
    const shot: StoryboardShot = state.storyboard.shots[index];
    const shotProgress = 55 + Math.round(((index + 0.2) / totalShots) * 40);

    reportProgress(onProgress, {
      stage: "generate_shots",
      progress: shotProgress,
      message: `Generating shot ${index + 1}/${totalShots}: ${shot.title}`,
    });

    const task = await createVideoTask({
      prompt: shot.videoPrompt,
      duration: shot.durationSeconds,
    });

    const completed = await waitForVideo(task.output.task_id, {
      onStatus: (status: VideoTaskStatus) => {
        reportProgress(onProgress, {
          stage: "generate_shots",
          progress: shotProgress + 5,
          message: `Shot ${index + 1}/${totalShots} — ${status}`,
        });
      },
    });

    shots.push({
      id: shot.id,
      title: shot.title,
      narration: shot.narration,
      videoPrompt: shot.videoPrompt,
      videoUrl: completed.output.video_url!,
      taskId: task.output.task_id,
    });
  }

  return {
    shots,
    ...reportProgress(onProgress, {
      stage: "generate_shots",
      progress: 95,
      message: `Generated ${shots.length} video clips`,
    }),
  };
}

async function finalizeNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  const primaryVideoUrl = state.shots[0]?.videoUrl ?? null;

  return {
    primaryVideoUrl,
    ...reportProgress(onProgress, {
      stage: "finalize",
      progress: 100,
      message: "Promo video ready",
    }),
  };
}

const showrunnerGraph = new StateGraph(ShowrunnerState)
  .addNode("parse_repo_step", parseRepoNode)
  .addNode("scout_step", scoutNode)
  .addNode("script_step", scriptNode)
  .addNode("storyboard_step", storyboardNode)
  .addNode("generate_shots_step", generateShotsNode)
  .addNode("finalize_step", finalizeNode)
  .addEdge(START, "parse_repo_step")
  .addEdge("parse_repo_step", "scout_step")
  .addEdge("scout_step", "script_step")
  .addEdge("script_step", "storyboard_step")
  .addEdge("storyboard_step", "generate_shots_step")
  .addEdge("generate_shots_step", "finalize_step")
  .addEdge("finalize_step", END)
  .compile();

export type ShowrunnerProgressCallback = (update: ShowrunnerProgress) => void;

export async function runShowrunner(
  repoUrl: string,
  onProgress?: ShowrunnerProgressCallback,
): Promise<ShowrunnerResult> {
  const finalState = await showrunnerGraph.invoke(
    {
      repoUrl,
      repoContext: null,
      scout: null,
      script: null,
      storyboard: null,
      shots: [],
      primaryVideoUrl: null,
      stage: "queued",
      progress: 0,
      message: null,
    },
    {
      configurable: { onProgress },
    },
  );

  if (
    !finalState.repoContext ||
    !finalState.scout ||
    !finalState.script ||
    !finalState.storyboard ||
    !finalState.primaryVideoUrl
  ) {
    throw new Error("Showrunner pipeline did not produce a complete result");
  }

  return {
    repoUrl,
    repoContext: finalState.repoContext,
    scout: finalState.scout,
    script: finalState.script,
    storyboard: finalState.storyboard,
    shots: finalState.shots,
    primaryVideoUrl: finalState.primaryVideoUrl,
  };
}
