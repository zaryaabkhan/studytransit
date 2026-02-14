# StudyTransit

**Find your flow.** AI-powered study space discovery, focus sessions, and virtual study rooms for students.

**Created by Noel Negron & Zaryaab Khan**

Built for [TreeHacks 2026](https://treehacks.com).

## Tracks we're applying for

- **Education** (Zoom) – Study space finder + virtual study rooms via Zoom
- **AI** (OpenAI) – AI study coach, natural language space recommendations
- **Human Flourishing** (Anthropic) – Evidence-informed study habits, wellbeing tips
- **Vercel** – Deployed on Vercel

## Features

- **Discover** – Find study spaces that match your preferences (noise level, intensity, group size). AI-powered natural language search.
- **Lock In** – Pomodoro-style focus timer with task types, energy check-in, and AI coaching.
- **Stats** – Weekly study dashboard, streaks, AI insights.
- **Virtual Study Room** – Start Zoom meetings for group study (Zoom × Render challenge).

## Tech stack

- React, Vite
- OpenAI API (optional; demo mode works without key)
- Zoom REST API (Mock API for testing)
- LocalStorage persistence

## Run locally

```bash
cd react-app
npm install
npm run dev
```

Open http://localhost:5173

### Optional: AI API keys (Claude or OpenAI)

Create `.env` in `react-app/` with one of:

```bash
# Claude (Anthropic) – checked first
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key

# OpenAI – used when Anthropic key is not set
VITE_OPENAI_API_KEY=sk-your-key
```

Without either key, AI features use built-in demo responses.

## Deploy

- **Vercel**: `vercel` or connect this repo
- **Render**: Use the Vite template; output dir `dist`

## Demo for judges

1. **Discover** – Pick preferences, click "Find me a spot" (works even with no ratings). Click "Get AI suggestions" for AI-curated matches.
2. **Lock In** – Start a focus session, complete it, rate a room.
3. **Stats** – Click "Load demo data (for judges)" to seed sample data, then "Ask AI for weekly insights."
4. **Virtual Study Room** – Click "Start Virtual Study Room" on Home for instructions and link options (Zoom).

## License

MIT
