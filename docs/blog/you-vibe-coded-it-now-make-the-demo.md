# You vibe coded the app. Now make the demo.

I built Repromo for a simple reason: shipping an app is easier than explaining it.

You paste a link. Agents read what you built, write a short pitch, plan a couple of scenes, and film real clips. You get a playable demo video back. That is the whole product.

Live: [repromo.vercel.app](https://repromo.vercel.app)  
Code: [github.com/fozagtx/repromo](https://github.com/fozagtx/repromo)

## The gap after “it works on my machine”

A lot of builders can get a product up in a weekend. Landing page. Auth. A feature that actually does something.

Then someone asks for a demo.

You open CapCut. You record your screen three times because the wrong tab was visible. You rewrite the voiceover because it sounds like you are reading a README. An hour later you still do not have something you would post.

That is not a skill problem. It is a time problem. Demo video sits after the fun part of building, so it gets skipped. Or it becomes a Loom nobody watches twice.

Repromo is my answer to that: treat the demo like another agent job, not another weekend project.

## What it does

1. You paste a **website** or **GitHub** URL.
2. A showrunner pipeline runs: parse → scout → script → storyboard → film → finalize.
3. You get clips plus the script, with pause and stop while it runs.

It is not a slide deck generator. It calls live models. If the API key is missing, it fails loud. No fake video URLs.

## How the showrunner is wired

I built this for **Track 2: AI Showrunner** in the Global AI Hackathon with Qwen Cloud. The stack is boring on purpose:

- **Next.js** for the app and APIs
- **LangGraph.js** for the agent graph
- **Qwen** (via Alibaba DashScope) for scout, script, and storyboard
- **HappyHorse** for text-to-video
- **Neon Postgres** so job status survives serverless instances

Proof files if you want to poke the Alibaba side:

- [`src/lib/qwen/client.ts`](https://github.com/fozagtx/repromo/blob/main/src/lib/qwen/client.ts)
- [`src/lib/video/happyhorse.ts`](https://github.com/fozagtx/repromo/blob/main/src/lib/video/happyhorse.ts)

The creative steps run on Qwen. The film step hits HappyHorse async video synthesis and polls until the clip is ready. Progress shows in the UI so you are not staring at a frozen button for five minutes.

## Design choices that matter

**Two shots, not ten.** More scenes burn time and money. Two short clips is enough to prove the product exists and looks real.

**Source first.** The agents read your site or repo before they invent a pitch. That keeps the narration closer to what you actually shipped.

**Controls.** Pause, resume, and stop are first-class. Video jobs are slow. People should be able to bail without closing the tab and praying.

**Durable jobs.** In-memory Maps die on Vercel. Neon keeps status across instances so polling actually works in production.

## What I am not claiming

Repromo will not replace a polished launch film with a human editor and a real camera. It will not invent product-market fit. It will not save a empty landing page.

It will get you from “I shipped something” to “here is a clip I can send” without opening a timeline editor.

That is the bar.

## Try it

1. Open [repromo.vercel.app](https://repromo.vercel.app)
2. Paste a public site or GitHub repo
3. Hit make video and wait through the stages

If you want to run it locally, the repo has setup notes and an MIT license. Clone it, set `DASHSCOPE_API_KEY` and `DATABASE_URL`, and you are in.

## Why I shipped this

I kept watching builders finish apps and then stall on the part that gets attention: a short, shareable demo.

So I built the missing step as an AI showrunner instead of another template. Paste the link. Get the film. Go back to building.

If you try it and the output is wrong for your product, tell me what broke. The interesting bugs are usually in the scout or storyboard step, not the UI.

fawuzan  
[repromo.vercel.app](https://repromo.vercel.app) · [github.com/fozagtx/repromo](https://github.com/fozagtx/repromo)
