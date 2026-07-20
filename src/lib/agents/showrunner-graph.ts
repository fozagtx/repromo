import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  fetchProjectContext,
  type ProjectContext,
} from "@/lib/source/fetch-source";
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
  sourceUrl: string;
  projectContext: ProjectContext;
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
  sourceUrl: Annotation<string>,
  projectContext: Annotation<ProjectContext | null>,
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

export type ShowrunnerProgressCallback = (update: ShowrunnerProgress) => void;

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

async function parseSourceNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  reportProgress(onProgress, {
    stage: "parse_repo",
    progress: 5,
    message: "Opening your link",
  });

  const projectContext = await fetchProjectContext(state.sourceUrl);

  return {
    projectContext,
    ...reportProgress(onProgress, {
      stage: "parse_repo",
      progress: 10,
      message:
        projectContext.kind === "github"
          ? `Loaded ${projectContext.name}`
          : `Loaded ${projectContext.name}`,
    }),
  };
}

async function scoutNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.projectContext) {
    throw new Error("Project context missing before scout step");
  }

  reportProgress(onProgress, {
    stage: "scout",
    progress: 15,
    message: "Learning what you built",
  });

  const sourceLabel =
    state.projectContext.kind === "github" ? "GitHub repository" : "website";

  const model = getQwenModel().withStructuredOutput(ScoutOutputSchema);
  const scout = await model.invoke([
    {
      role: "system",
      content: `You are a product marketing scout. Analyze this ${sourceLabel} for a founder who vibe-coded their app and now needs a short demo / launch video. Extract concise positioning. Keep outputs token-efficient.`,
    },
    {
      role: "user",
      content: state.projectContext.rawContext,
    },
  ]);

  return {
    scout,
    ...reportProgress(onProgress, {
      stage: "scout",
      progress: 25,
      message: `Got the pitch for ${scout.productName}`,
    }),
  };
}

async function scriptNode(
  state: ShowrunnerStateType,
  config?: { configurable?: { onProgress?: ShowrunnerProgressCallback } },
): Promise<Partial<ShowrunnerStateType>> {
  const onProgress = config?.configurable?.onProgress;
  if (!state.scout || !state.projectContext) {
    throw new Error("Scout output missing before script step");
  }

  reportProgress(onProgress, {
    stage: "script",
    progress: 30,
    message: "Writing your demo pitch",
  });

  const model = getQwenModel().withStructuredOutput(ScriptOutputSchema);
  const script = await model.invoke([
    {
      role: "system",
      content:
        "You are writing a 15-30 second demo / launch video script for a vibe-coded product. Hook fast, show the value, end with a clear CTA. Sound human, not corporate.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          source: state.projectContext.url,
          sourceKind: state.projectContext.kind,
          productName: state.projectContext.name,
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
      message: "Pitch draft ready",
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
    message: "Planning the scenes",
  });

  const model = getQwenModel().withStructuredOutput(StoryboardOutputSchema);
  const storyboard = await model.invoke([
    {
      role: "system",
      content:
        "You are storyboarding a short product demo video. Break the script into exactly 2 shots. Each videoPrompt must be vivid and suitable for text-to-video. Show the product vibe, not tiny unreadable UI text. Avoid text overlays in prompts.",
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
      message: `Planned ${storyboard.shots.length} scenes`,
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
      message: `Filming scene ${index + 1}/${totalShots}`,
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
          message: `Scene ${index + 1}/${totalShots} - ${status.toLowerCase()}`,
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
      message: `Filmed ${shots.length} scenes`,
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
      message: "Your demo video is ready",
    }),
  };
}

const showrunnerGraph = new StateGraph(ShowrunnerState)
  .addNode("parse_source_step", parseSourceNode)
  .addNode("scout_step", scoutNode)
  .addNode("script_step", scriptNode)
  .addNode("storyboard_step", storyboardNode)
  .addNode("generate_shots_step", generateShotsNode)
  .addNode("finalize_step", finalizeNode)
  .addEdge(START, "parse_source_step")
  .addEdge("parse_source_step", "scout_step")
  .addEdge("scout_step", "script_step")
  .addEdge("script_step", "storyboard_step")
  .addEdge("storyboard_step", "generate_shots_step")
  .addEdge("generate_shots_step", "finalize_step")
  .addEdge("finalize_step", END)
  .compile();

export async function runShowrunner(
  sourceUrl: string,
  onProgress?: ShowrunnerProgressCallback,
): Promise<ShowrunnerResult> {
  const finalState = await showrunnerGraph.invoke(
    {
      sourceUrl,
      projectContext: null,
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
    !finalState.projectContext ||
    !finalState.scout ||
    !finalState.script ||
    !finalState.storyboard ||
    !finalState.primaryVideoUrl
  ) {
    throw new Error("Showrunner pipeline did not produce a complete result");
  }

  return {
    sourceUrl,
    projectContext: finalState.projectContext,
    scout: finalState.scout,
    script: finalState.script,
    storyboard: finalState.storyboard,
    shots: finalState.shots,
    primaryVideoUrl: finalState.primaryVideoUrl,
  };
}
