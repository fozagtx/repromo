<div align="center">

# Repromo

**Paste a GitHub repo. Ship a promo video.**

Agentic showrunner on [Qwen Cloud](https://home.qwencloud.com) that turns any public repository into a short promotional video with HappyHorse / Wan.

[Live demo](https://repromo.vercel.app) · [Architecture](docs/ARCHITECTURE.md) · [Devpost Track 2: AI Showrunner](#hackathon)

</div>

---

## What it does

Developers ship products without a launch video. Writing a script, storyboarding shots, and rendering clips usually means a designer, an editor, or a weekend of Canva.

**Ship-Video** takes a GitHub URL and runs a multi-agent LangGraph pipeline:

1. **Scout** — ingest README, stack, and positioning  
2. **Script** — write a tight 15–30s promo narration  
3. **Storyboard** — break it into cinematic shot prompts  
4. **Render** — generate real clips with HappyHorse on DashScope  

No mock videos. Live Qwen reasoning + live video synthesis.

---

## Features

| | |
|---|---|
| **Agentic pipeline** | Scout → Script → Storyboard → Render without hand-holding |
| **1080p-ready exports** | HappyHorse / Wan text-to-video via DashScope async APIs |
| **Qwen-powered copy** | Scripts and shot lists grounded in real repo context |
| **Multi-shot storyboard** | Intro energy, product highlight, clear CTA beat |
| **LangGraph orchestration** | Explicit graph nodes (not a fragile free-form tool loop) |
| **Hackathon-ready proof** | Clear Alibaba Cloud API usage in-repo for judges |

---

## Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS 4, HeroUI 3, Iconify Solar
- **Agents:** LangGraph.js + LangChain OpenAI-compatible client
- **LLM:** Qwen on DashScope (`compatible-mode/v1`)
- **Video:** HappyHorse (`happyhorse-1.1-t2v`) / Wan via DashScope video-synthesis

---

## Quick start

```bash
git clone https://github.com/fozagtx/repromo.git
cd repromo
npm install
cp .env.example .env.local
```

Set your key in `.env.local`:

```bash
DASHSCOPE_API_KEY=sk-...
```

> [!IMPORTANT]
> Get a free trial key from [Qwen Cloud](https://home.qwencloud.com/api-keys). Without `DASHSCOPE_API_KEY`, generation fails fast — there is no mock mode.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a repo like `github.com/vercel/next.js`, hit **Generate**.

> [!NOTE]
> Video rendering is async and can take several minutes per shot. The UI polls job progress (Scout → Script → Storyboard → Render).

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | **yes** | — | Qwen Cloud / DashScope API key |
| `QWEN_MODEL` | no | `qwen-plus` | Chat model for scout / script / storyboard |
| `DASHSCOPE_VIDEO_MODEL` | no | `happyhorse-1.1-t2v` | Text-to-video model |
| `GITHUB_TOKEN` | no | — | Raises GitHub API rate limits for repo ingest |

---

## Hackathon

**Track:** Global AI Hackathon with Qwen Cloud — **Track 2: AI Showrunner**

### Alibaba Cloud proof (for Devpost)

Judges can verify DashScope usage here:

- [`src/lib/qwen/client.ts`](src/lib/qwen/client.ts) — Qwen via OpenAI-compatible DashScope endpoint  
- [`src/lib/video/happyhorse.ts`](src/lib/video/happyhorse.ts) — HappyHorse / Wan async video synthesis + polling  

Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

### Pipeline (LangGraph)

```text
parse_repo → scout → script → storyboard → generate_shots → finalize
```

---

## API

Start a job:

```bash
curl -X POST https://YOUR_DEPLOYMENT/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"https://github.com/vercel/next.js"}'
```

Poll status:

```bash
curl https://YOUR_DEPLOYMENT/api/jobs/<jobId>
```

---

## Project layout

```text
src/
  app/                 # Landing UI + API routes
  components/          # Action / feature cards (Design ProMax)
  lib/
    agents/            # LangGraph showrunner
    qwen/              # DashScope chat client
    video/             # HappyHorse create + poll
    github/            # Repo ingest
    jobs/              # Job status store
docs/ARCHITECTURE.md   # System diagram for judges
```

---

## Deploy

**Production:** [https://repromo.vercel.app](https://repromo.vercel.app)

Connected GitHub repo: [fozagtx/repromo](https://github.com/fozagtx/repromo)

```bash
npm i -g vercel
vercel link
vercel env add DASHSCOPE_API_KEY
vercel --prod
```

> [!WARNING]
> Set `DASHSCOPE_API_KEY` (and optionally `GITHUB_TOKEN`) in the Vercel project env before generating videos in production. Hobby plan caps `/api/generate` at 300s — HappyHorse can take several minutes per shot.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

<div align="center">

Built for the **Qwen Cloud Global AI Hackathon** · MIT

</div>
