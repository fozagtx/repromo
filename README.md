# Ship-Video

**Track 2: AI Showrunner** — paste a GitHub repo, get a promotional video.

Powered by **Qwen Cloud** (reasoning + script/storyboard agents) and **HappyHorse / Wan** (video generation) on Alibaba DashScope, orchestrated with **LangGraph.js** in **Next.js**.

## Features

- Floating dark landing UI: paste `github.com/owner/repo` → Generate
- Multi-agent showrunner: Scout → Script → Storyboard → Render
- Live DashScope APIs only (no mock video / fake scripts)
- Job progress polling with final MP4 playback

## Stack

- Next.js 16 (App Router) + Tailwind CSS
- LangGraph.js + LangChain OpenAI-compatible client → Qwen
- DashScope HappyHorse text-to-video (`happyhorse-1.1-t2v`)

## Setup

```bash
npm install
cp .env.example .env.local
# set DASHSCOPE_API_KEY from https://home.qwencloud.com/api-keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHSCOPE_API_KEY` | yes | Qwen Cloud / DashScope API key |
| `QWEN_MODEL` | no | Default `qwen-plus` |
| `DASHSCOPE_VIDEO_MODEL` | no | Default `happyhorse-1.1-t2v` |
| `GITHUB_TOKEN` | no | Higher GitHub rate limits |

## Alibaba Cloud proof (for Devpost)

- [`src/lib/qwen/client.ts`](src/lib/qwen/client.ts)
- [`src/lib/video/happyhorse.ts`](src/lib/video/happyhorse.ts)

Architecture diagram: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## API

```bash
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"repoUrl":"https://github.com/vercel/next.js"}'

curl http://localhost:3000/api/jobs/<jobId>
```

Video generation is async and can take several minutes per shot.

## License

MIT — see [LICENSE](LICENSE).
