import { z } from "zod";

export const ScoutOutputSchema = z.object({
  productName: z.string().describe("Name of the product or project"),
  tagline: z.string().describe("One-line pitch"),
  audience: z.string().describe("Primary target audience"),
  differentiators: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Key differentiators vs alternatives"),
  visualMotifs: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Visual themes for promo video"),
  techStack: z.array(z.string()).describe("Main technologies used"),
});

export const ScriptOutputSchema = z.object({
  title: z.string(),
  durationSeconds: z.number().int().min(10).max(30),
  hook: z.string().describe("Opening hook (2-3 seconds)"),
  problem: z.string().describe("Problem statement"),
  solution: z.string().describe("How the product solves it"),
  cta: z.string().describe("Call to action"),
  fullScript: z.string().describe("Complete narration script"),
});

export const StoryboardShotSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  narration: z.string(),
  videoPrompt: z
    .string()
    .describe("Detailed text-to-video prompt for HappyHorse"),
  cameraMotion: z.string(),
  durationSeconds: z.number().int().min(3).max(8),
});

export const StoryboardOutputSchema = z.object({
  shots: z.array(StoryboardShotSchema).min(2).max(2),
});

export type ScoutOutput = z.infer<typeof ScoutOutputSchema>;
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
export type StoryboardShot = z.infer<typeof StoryboardShotSchema>;
export type StoryboardOutput = z.infer<typeof StoryboardOutputSchema>;
