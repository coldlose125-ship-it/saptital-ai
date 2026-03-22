# Sapital AI — 청각장애인 병원 진료 맞춤 소통 서비스

## Overview

pnpm workspace monorepo using TypeScript. The main product is **Sapital AI**, a hospital-specialized bidirectional communication service for hearing-impaired patients featuring real-time captioning, Gemini AI medical analysis, medical terms sidebar, TTS quick-reply, font size controls, session export, and localStorage persistence.

## Architecture

- **Frontend** (`artifacts/caption-ai`): React + Vite + Tailwind CSS v4 + Framer Motion
- **Backend** (`artifacts/api-server`): Express 5 API server with Gemini AI integration
- **AI**: Gemini 2.5 Flash via Replit AI Integrations (`@workspace/integrations-gemini-ai`)
- **Speech**: Web Speech API (recognition + TTS) — Chrome required
- **Storage**: localStorage (`sapital_session_v1` key) with quota overflow warning

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React 19, Vite 7, Tailwind CSS v4
- **Validation**: Zod (`zod/v4`)
- **Build**: esbuild (API server), Vite (frontend)

## Key Features

1. **Real-time captioning** — Web Speech API with sentence-boundary detection, idle flush, 5-minute silence watchdog
2. **Gemini AI analysis** — Medical term extraction, sentiment, topic classification, tier badges, suggested replies
3. **Medical terms sidebar** — Desktop right panel, mobile bottom drawer with scroll
4. **TTS quick-reply** — 3 AI-suggested replies with Korean voice priority selection, speaking state feedback
5. **Font size controls** — 3 levels (표준/크게/매우 크게), desktop header + mobile bottom bar
6. **Session export** — Copy to clipboard, PDF save, print — A4 formatted report with XSS-safe HTML escaping
7. **localStorage persistence** — Auto-save with quota overflow user warning
8. **Delete confirmation** — Centered modal dialog with cancel/delete buttons + Escape key
9. **Splash screen** — Branded 2.5s intro animation
10. **Dark mode** — Full dark theme with CSS custom properties, toggle persisted to localStorage (`sapital_theme`)
11. **Bilingual i18n** — Korean/English toggle via `SettingsProvider` context, all UI strings translated, persisted to localStorage (`sapital_locale`)

## Structure

```text
artifacts/
├── caption-ai/           # React frontend (port from PORT env)
│   └── src/
│       ├── pages/home.tsx        # Main page — all state management
│       ├── components/           # UI components
│       │   ├── QuickReplyBar.tsx  # TTS reply buttons with speaking state
│       │   ├── MedicalTermsPanel.tsx  # Medical terms sidebar
│       │   ├── TranscriptItem.tsx # Individual transcript block
│       │   ├── ExportModal.tsx    # Session export modal
│       │   ├── AlertBar.tsx       # Alert notifications
│       │   └── SplashScreen.tsx   # Splash animation
│       ├── hooks/
│       │   ├── use-speech.ts      # Web Speech API hook with sentence buffering
│       │   └── use-audio-devices.ts  # Audio device enumeration
│       ├── lib/
│       │   ├── ai-service.ts      # API calls + TTS engine with voice priority
│       │   ├── caption-engine.ts  # Keyword detection + scoring
│       │   ├── i18n.ts            # Translation strings (ko/en) + helper functions
│       │   └── settings-context.tsx  # React context for theme (dark/light) + locale (ko/en)
│       └── index.css              # Tailwind config + custom animations
├── api-server/           # Express 5 backend (port from PORT env)
│   └── src/
│       ├── index.ts               # Server entry
│       ├── app.ts                 # Express app setup + production static serving
│       └── routes/
│           ├── index.ts           # Route aggregator
│           ├── health.ts          # GET /api/healthz
│           └── ai/index.ts        # POST /api/ai/analyze, /api/ai/summarize
└── mockup-sandbox/       # Component preview server (dev only)
```

## Deployment

- **Type**: Reserved VM (no sleep mode)
- **Build**: `BASE_PATH=/ pnpm --filter @workspace/caption-ai run build && pnpm --filter @workspace/api-server run build`
- **Run**: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- **Production**: Single Express server serves both API routes (`/api/*`) and built React frontend via `express.static`
- Express 5 requires `/{*splat}` wildcard syntax for catch-all routes

## Environment Variables / Secrets

- `AI_INTEGRATIONS_GEMINI_API_KEY` — Auto-provided by Replit Gemini integration
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Auto-provided by Replit Gemini integration
- `PORT` — Auto-assigned by Replit per artifact
- No hardcoded API keys in codebase

## API Endpoints

- `POST /api/ai/analyze` — Analyze medical speech text with Gemini AI
- `POST /api/ai/summarize` — Summarize multiple transcript entries
- `GET /api/healthz` — Health check

## Key Technical Details

- **API timeout**: 15s AbortController on both analyze/summarize calls
- **Stale state guard**: `sessionIdRef` incremented on clear, checked before setState
- **Font sizes**: `['text-3xl md:text-4xl', 'text-4xl md:text-5xl', 'text-5xl md:text-6xl']`
- **TTS voice priority**: Google 한국의 > Yuna > Sora > Nari > Google 한국어 > Microsoft Heami > Microsoft Sora
- **Sentence detection**: Korean sentence-final endings regex + 160 char force flush + 3.5s idle flush
- **Silence watchdog**: 5 minutes of no speech → auto-stop recognition
