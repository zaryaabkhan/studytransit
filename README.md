# StudyTransit

**Find your flow.** AI-powered study space discovery and focus sessions for students.

**Created by Noel Negron & Zaryaab Khan**

Built for [TreeHacks 2026](https://treehacks.com).

## Inspiration

We kept seeing students wander between libraries, check crowdedness, and lose focus before actually studying. We wanted to cut that friction: a single app to discover the right space, lock in with a focus timer, and track progress with streaks and exam prep. StudyTransit brings discovery, focus, and accountability into one flow, so you spend less time hunting and more time studying.

## What it does

- **Home** – Browse Columbia University libraries (Butler, Avery, Uris, Lehman, etc.) with aggregate ratings. Rate spaces by crowdedness (1–5) to help others.
- **Discover** – Set preferences (intensity, noise, group size, duration) or describe what you need in plain English. "Find me a spot" shows rule-based matches from crowd ratings; "Get AI suggestions" returns Claude-curated recommendations with reasons.
- **Lock In** – Pick task type (exam/reading/writing/project), energy, and rate your current space. Run a focused timer. After each session, rate your focus (1–5) and optionally get one AI tip for next time.
- **Stats** – Weekly minutes, study streaks, coaching tips from your data. Add exams manually or drag-and-drop a syllabus PDF to extract dates and study topics. Click any exam for a checkable to-do list and contextual AI study tips.

## How we built it

React + Vite SPA with React Router. Libraries and study spaces (including capacity) are stored in Firebase Firestore and loaded on startup; the app falls back to built-in Columbia data if Firebase is not configured. Sessions, exams, ratings, and weekly goals live in LocalStorage. Claude (Anthropic) is preferred for AI; OpenAI is fallback. In dev, Vite proxies `/api/anthropic` to avoid CORS. PDF parsing uses pdfjs-dist, then Claude extracts exam dates and study topics. Discover uses `useSpaceRecommendations` (scoring by noise, intensity, occupancy, capacity) plus `getAISpaceRecommendations` for AI.

## Challenges we ran into

- **Syllabus parsing** – PDFs vary a lot. We used text extraction plus Claude to get exam dates and topics, with fallback "recommended" topics when parsing failed.
- **Claude from the browser** – CORS and direct-browser access required some setup. We iterated on prompts and models until AI responses were consistent.
- **Scope** – Balancing AI features (recommendations, syllabus parsing, insights, tips) with a simple UI. We cut or simplified features to keep the core flow clear.

## Accomplishments that we're proud of

- **End-to-end flow** – Discovery → Lock In → Stats, all working together.
- **AI integration** – Multiple AI touchpoints (recommendations, syllabus parsing, study tips, weekly insights) with fallbacks when the API key is missing.
- **Exam workflow** – Upload a PDF, get exams and study to-dos, and check them off as you go.
- **Clean, themed UI** – Columbia University branding with consistent footer nav and modals.

## What we learned

- AI works well for structured tasks (parsing syllabi, summarizing stats, generating tips) when prompts are clear and outputs are constrained.
- LocalStorage is enough for a demo; sessions, exams, and ratings persist without a backend.
- Small UX choices (shorter demo timer, simpler reflection, no clutter) make the app feel calmer and easier to use.

## What's next for StudyTransit

- **Campus integration** – Real library occupancy or space availability from Columbia systems.
- **Backend + auth** – Sync sessions and exams across devices and users.
- **Virtual study rooms** – Zoom integration for one-click group study links.
- **Mobile app** – Native experience for on-the-go discovery and focus.

## Tracks we are applying to

**We are in the Education track** (sponsor: Zoom). TreeHacks 2026 Education Grand Prize awards the top study/learning apps that help students discover spaces, focus, and track progress.

StudyTransit fits the Education track by:
- Helping students find the right study spaces (libraries, quiet rooms, group areas)
- Lock In focus timer for productive study sessions
- Stats dashboard with streaks, exam deadlines, and AI-powered study tips


## Features

- **Home** – Columbia library list with ratings
- **Discover** – Preference-based + AI space recommendations
- **Lock In** – Focus timer (10 sec–3 min), task/energy, post-session reflection, AI tips
- **Stats** – Weekly dashboard, streaks, exam deadlines, syllabus PDF upload, study to-dos

## Tech stack

- React 18, Vite 6, React Router 6
- Firebase (Firestore for libraries and spaces with capacity, Hosting)
- pdfjs-dist for PDF text extraction
- Claude (Anthropic) + OpenAI APIs (demo mode without key)
- LocalStorage for sessions, exams, ratings, goals

## Run locally

```bash
cd react-app
npm install
npm run dev
```

Open http://localhost:5173

### Optional: Firebase (libraries and spaces)

Add to `.env` to load libraries and spaces from Firestore:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Firestore collections: `libraries` (doc ID = lib-1, lib-2, …; fields: name, location), `spaces` (doc ID = s1, s2, …; fields: libraryId, name, capacity). Run `node scripts/seed-firestore.js` to print seed data, then add docs in Firebase Console with matching IDs. Without Firebase config, the app uses built-in Columbia data.

### Optional: AI API keys (Claude or OpenAI)

Add to `.env`:

```bash
# Claude (Anthropic) – checked first
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key

# OpenAI – used when Anthropic key is not set
VITE_OPENAI_API_KEY=sk-your-key
```

Without either key, AI features use built-in demo responses.

## Demo for judges

1. **Home** – Browse libraries, rate a space (picks space + crowdedness 1–5).
2. **Discover** – Pick intensity, noise, group size, duration. Click "Find me a spot" for rule-based matches. Click "Get AI suggestions" for AI-curated recommendations.
3. **Lock In** – Select task, energy, and your space. Start the timer (10 sec for quick demo). After reflection, click "Get a tip for next time" for AI advice.
4. **Stats** – Click "Load demo data (for judges)" to seed sample sessions, then "Ask AI for weekly insights." Add an exam manually or upload a syllabus PDF. Open an exam to see the study to-do and "Get a study tip."

## License

MIT
