# AI Ad Creator

An AI-powered advertising creative studio built with Next.js and v0. Generate scroll-stopping ad images and videos from text prompts using fal.ai models — with storyboards, moment images, and asset uploads in one dashboard.

**Live:** https://v0-ai-ad-creator-vert-nine.vercel.app

## Features

- **AI image generation** — Create ad creatives from text prompts (`/api/generate-image`).
- **AI video generation** — Produce short ad videos (`/api/generate-video`).
- **Storyboards** — Generate multi-frame storyboard sequences for campaign planning.
- **Moment images** — Capture key "moments" as standalone ad assets.
- **Asset upload** — Upload your own images to remix into ads.
- **Modern studio UI** — Radix UI components, Tailwind styling, responsive layout.

## Tech stack

- **Framework:** Next.js (App Router), React, TypeScript
- **AI APIs:** fal.ai (`@fal-ai/client`, `@fal-ai/serverless-client`) for image + video generation
- **UI:** Radix UI primitives, Tailwind CSS, lucide-react icons, react-hook-form + zod
- **Deploy:** Vercel (auto-synced with v0.app)

## Quick start

**Prerequisites:** Node.js 20+, a [fal.ai](https://fal.ai) API key.

```bash
# 1. Clone and install
git clone https://github.com/girishlade111/ai-ad-creator.git
cd ai-ad-creator
npm install

# 2. Configure environment
cp .env.example .env   # or create .env
# Add: FAL_KEY=your_fal_ai_api_key

# 3. Run locally
npm run dev
```

Open http://localhost:3000 and start generating ads.

## Project structure

```
app/
  api/
    generate-image/        # POST: text-to-image ad generation
    generate-video/        # POST: text/image-to-video ad generation
    generate-storyboard/   # POST: multi-frame storyboard generation
    generate-moment-image/ # POST: key-moment image generation
    upload-image/          # POST: user asset uploads
  page.tsx                 # Studio dashboard
components/                # UI components (Radix/shadcn-style)
lib/                       # fal.ai client setup, helpers
public/                    # Static assets
styles/                    # Global styles
```

## Environment variables

| Variable | Purpose |
|---|---|
| `FAL_KEY` | fal.ai API key (required for all generation endpoints) |

## Deploy notes

Deployed on **Vercel** (auto-synced from v0.app). To redeploy elsewhere: push to a connected repo or run `vercel --prod`. Set `FAL_KEY` in the host's environment variables. This app needs server-side API routes, so it must run on a Node server/edge runtime — not statically exportable.

---

Built by Girish Lade — https://ladestack.in
