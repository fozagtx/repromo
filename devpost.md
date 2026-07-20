# Repromo — Devpost

**Track:** Track 2 — AI Showrunner  
**Live:** https://repromo.vercel.app  
**Repo:** https://github.com/fozagtx/repromo  

---

## Inspiration

Builders ship apps every day. Most of them still have no demo video.

You vibe-code a product over a weekend, deploy it, then hit the same wall: writing a pitch, storyboarding shots, and rendering clips takes longer than building the app. So launches go out with screenshots, a Notion doc, or silence.

We wanted a showrunner that meets builders where they already are — a website or a GitHub repo — and turns that into a short demo they can post the same day. Not a slide about AI. A real video.

---

## What it does

**Repromo** turns a public **website** or **GitHub** URL into a short demo / launch video.

1. Paste a link  
2. Agents **read** what you built, **write** a pitch, **plan** scenes, then **film** clips  
3. Watch progress live, **pause / stop** if needed, then **download** the MP4  

Under the hood it uses **Qwen** for creative work and **HappyHorse** for text-to-video on **Alibaba Cloud DashScope / Qwen Cloud** (Token Plan). No mock videos.

---

## How we built it

- **Frontend:** Next.js App Router, HeroUI, light UI with brand logo, favicons for pasted domains, download buttons  
- **Orchestration:** LangGraph.js showrunner — `parse → scout → script → storyboard → generate_shots → finalize`  
- **LLM:** Qwen (`qwen3.7-plus`) via Token Plan OpenAI-compatible endpoint  
- **Video:** HappyHorse (`happyhorse-1.1-t2v`) async synthesis + polling  
- **Jobs:** Neon Postgres so status survives Vercel serverless  
- **Safety:** IP rate limits on generate / download / job control  

Alibaba Cloud proof in-repo:

- [`src/lib/qwen/client.ts`](https://github.com/fozagtx/repromo/blob/main/src/lib/qwen/client.ts)  
- [`src/lib/video/happyhorse.ts`](https://github.com/fozagtx/repromo/blob/main/src/lib/video/happyhorse.ts)  

Architecture: [`docs/ARCHITECTURE.md`](https://github.com/fozagtx/repromo/blob/main/docs/ARCHITECTURE.md)

---

## Challenges we ran into

- **Serverless job store** — in-memory jobs 404’d across Vercel instances; we moved to Neon  
- **Billing confusion** — free-tier vs Token Plan keys/endpoints are not interchangeable; we wired the Token Plan base URL and key  
- **Long video renders** — HappyHorse is async and slow; we added polling UI, pause/stop, and clear errors  
- **Cross-origin downloads** — DashScope video URLs needed a download proxy with host allowlisting  
- **Abuse risk** — cheap to spam generates; we added per-IP rate limits  

---

## Accomplishments that we're proud of

- A full **AI showrunner** path from link → pitch → storyboard → real HappyHorse clips  
- **Honest product** — fail-fast, no fake videos, errors surface in the UI  
- Hackathon-ready packaging: public MIT repo, Alibaba proof links, architecture diagram, live deploy  
- Polish that matters for demos: logo PNGs, pause/stop, download, rate limits  

---

## What we learned

- Agent pipelines are only as trustworthy as job state and billing wiring  
- Qwen Cloud **Token Plan**, **Coding Plan**, and **pay-as-you-go** are separate credentials and hosts  
- For Track 2, fewer high-quality shots beat a long fragile pipeline  
- Judges and users need the same thing: a clear progress story and a file they can take away  

---

## What's next for Repromo

- Stitch multi-shot clips into one timeline with music / VO  
- Website screenshot → image-to-video for more product-faithful scenes  
- Brand kit upload (logo, colors, CTA) for on-brand outputs  
- Durable queue (beyond `after()`) for longer HappyHorse runs  
- Team workspaces and shareable public demo pages  
