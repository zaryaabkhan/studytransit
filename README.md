# StudyTransit

**Find your flow.** AI-powered study space discovery and focus sessions for students.

**Created by Noel Negron & Zaryaab Khan**

Built for [TreeHacks 2026](https://treehacks.com).

---

## Inspiration

We kept seeing students wander between libraries, check crowdedness, and lose focus before actually studying. We wanted to cut that friction: a single app to discover the right space, lock in with a focus timer, and track progress with streaks and exam prep. StudyTransit brings discovery, focus, and accountability into one flow, so you spend less time hunting and more time studying.

---

## What It Does

StudyTransit helps Columbia University students **discover the right study spaces**, **stay focused with a timer**, and **track progress** with streaks and exam prep—all in one app.

| Page | Description |
|------|-------------|
| **Home** | Browse Columbia libraries with live occupancy data. See "Best bet now" (least crowded library). Rate spaces (1–5) to contribute crowd-sourced data. |
| **Discover** | Set preferences: intensity (deep/steady/social), noise level (silent/busy/buzz), group size, session length. Describe needs in plain text. AI recommends 3–5 spaces with personalized reasons. |
| **Lock In** | Pick task type (exam/reading/writing/project), energy level, and your current space. Run a focus timer (10 sec–3 min). Rate your focus after each session and get AI coaching tips. |
| **Stats** | Weekly dashboard: study streak, focused minutes, completed sessions. Set weekly goals. Add exams manually or upload a syllabus PDF to extract dates and study topics. Get AI insights and exam-specific tips. |

---

## How We Built It

React + Vite SPA with React Router. Libraries and study spaces are stored in Firebase Firestore (collection `Libraries` with subcollection `spaces` per library); the app falls back to built-in Columbia data if Firebase is not configured. Sessions, exams, ratings, and weekly goals live in LocalStorage. Claude (Anthropic) is preferred for AI; OpenAI is fallback. In dev, Vite proxies `/api/anthropic` to avoid CORS. PDF parsing uses pdfjs-dist, then Claude extracts exam dates and study topics. Discover uses `getAISpaceRecommendations` for AI-curated space matches (with rule-based demo fallback when no API key).

---

## Challenges We Ran Into

- **Syllabus parsing** – PDFs vary a lot. We used text extraction plus Claude to get exam dates and topics, with fallback "recommended" topics when parsing failed.
- **Claude from the browser** – CORS and direct-browser access required some setup. We iterated on prompts and models until AI responses were consistent.
- **Scope** – Balancing AI features (recommendations, syllabus parsing, insights, tips) with a simple UI. We cut or simplified features to keep the core flow clear.

---

## Accomplishments That We're Proud Of

- **End-to-end flow** – Discovery → Lock In → Stats, all working together.
- **AI integration** – Multiple AI touchpoints (recommendations, syllabus parsing, study tips, weekly insights) with fallbacks when the API key is missing.
- **Exam workflow** – Upload a PDF, get exams and study to-dos, and check them off as you go.
- **Clean, themed UI** – Columbia University branding with consistent footer nav and modals.

---

## What We Learned

- AI works well for structured tasks (parsing syllabi, summarizing stats, generating tips) when prompts are clear and outputs are constrained.
- LocalStorage is enough for a demo; sessions, exams, and ratings persist without a backend.
- Small UX choices (shorter demo timer, simpler reflection, no clutter) make the app feel calmer and easier to use.

---

## What's Next for StudyTransit

- **Campus integration** – Real library occupancy or space availability from Columbia systems.
- **Backend + auth** – Sync sessions and exams across devices and users.
- **Virtual study rooms** – Zoom integration for one-click group study links.
- **Mobile app** – Native experience for on-the-go discovery and focus.

---

## Tracks We Are Applying To

**We are in the Education track** (sponsor: Zoom). TreeHacks 2026 Education Grand Prize awards the top study/learning apps that help students discover spaces, focus, and track progress.

StudyTransit fits the Education track by:
- Helping students find the right study spaces (libraries, quiet rooms, group areas)
- Lock In focus timer for productive study sessions
- Stats dashboard with streaks, exam deadlines, and AI-powered study tips

---

## Tech Stack

- **Frontend**: React 18, Vite 6, React Router 6
- **Data**: Firebase Firestore (libraries, spaces, capacity)
- **AI**: Anthropic Claude (primary), OpenAI (fallback). Demo mode when no API key.
- **PDF**: pdfjs-dist for syllabus text extraction + AI for exam/topic parsing
- **Charts**: Recharts for space occupancy trends
- **Persistence**: LocalStorage for ratings, focus sessions, exams, goals

---

## Project Structure

```
react-app/
├── src/
│   ├── App.jsx              # Routes + AppShell with footer nav
│   ├── main.jsx
│   ├── theme.css             # Columbia University theme (primary blues)
│   ├── styles.css
│   │
│   ├── pages/
│   │   ├── HomePage.jsx      # Library list, best bet, rating modal
│   │   ├── LibraryPage.jsx   # Spaces for one library (SpaceCard grid)
│   │   ├── DiscoverPage.jsx  # Preference form → AI recommendations
│   │   ├── LockPage.jsx     # Focus timer, reflection, AI tips
│   │   └── StatsPage.jsx    # Streaks, goals, exams, syllabus upload, AI insights
│   │
│   ├── components/
│   │   ├── SpaceCard.jsx    # Occupancy display, weekly chart, community avg
│   │   ├── FooterNav.jsx    # Home / Discover / Lock In / Stats
│   │   └── Logo.jsx
│   │
│   ├── state/
│   │   └── AppState.jsx     # Global state (libraries, spaces, ratings, sessions, exams)
│   │
│   ├── services/
│   │   ├── aiClient.js      # Claude/OpenAI: recommendations, coaching, syllabus parsing
│   │   ├── pdfParser.js     # Extract text from PDFs
│   │   └── firebase.js      # Firestore init (alternative to firebase/)
│   │
│   ├── firebase/
│   │   ├── firebase.js      # Firebase app + Firestore db
│   │   ├── firebase_utility.jsx  # fetchAllLibraries, fetchAllSpacesFromLibrary, updateSpaceCapacityAndCounter
│   │   └── seed_columbia_libraries.js.js  # Admin seed script (Libraries collection)
│   │
│   └── hooks/
│       └── useRecommender.js  # Rule-based scoring (noise, intensity, capacity)
│
├── scripts/
│   └── seed-firestore.js    # Prints flat libraries/spaces JSON (different schema)
├── vercel.json              # SPA rewrites for Vercel deploy
└── vite.config.js           # Proxy /api/anthropic → Anthropic API (keeps key server-side in dev)
```

---

## How It Works

### Libraries & Spaces (Firebase)

- **Collection**: `Libraries` (doc IDs: lib1, lib2, …)
- **Fields**: `library_name`, optional `location`
- **Subcollection**: `Libraries/{libraryId}/spaces` — each space has `room_data`:
  - `space_name`, `space_capacity`, `space_counter`
  - Day keys: `Monday`, `Tuesday`, … for weekly occupancy trends

The app loads libraries on mount, then fetches spaces per library. If Firebase is not configured, it falls back to hardcoded Columbia data in `AppState.jsx`.

### Occupancy & Ratings

- **space_capacity** / **space_counter** → ratio (capacity ÷ people rated) → fullness 1–5
- When a user starts a Lock In session and rates a space, the app increments `space_counter` and adds the rating to `space_capacity` (weighted). Firestore is updated via `updateSpaceCapacityAndCounter`.
- **Community ratings** (1–5) are stored in LocalStorage and used for Discover scoring and SpaceCard display.

### AI Features (aiClient.js)

| Function | Purpose |
|----------|---------|
| `getAISpaceRecommendations` | Matches spaces to preferences; returns JSON array with space, library, reason |
| `getSessionCoachingSummary` | Post-session tip based on task, energy, duration |
| `getWeeklyStudyInsights` | Interpret weekly stats into actionable suggestions |
| `parseSyllabusExams` | Extract exam/midterm dates from PDF text |
| `extractSyllabusTopics` | Extract study topics from syllabus for an exam |
| `getExamStudyTip` | One contextual tip for upcoming exam |
| `getFocusPrompt` | Short pre-session motivation |

Uses Anthropic first; falls back to OpenAI if no Anthropic key. Demo mode returns built-in responses when neither key is set.

### Focus Sessions (Lock In)

- Sessions are stored in LocalStorage (`lionstudy_focus_sessions`).
- Each session: `started_at`, `duration_minutes`, `task`, `energy`, `completed`, `reflection` (optional focus rating).
- Stats page computes: weekly minutes, study streak (consecutive days with ≥1 completed session), task breakdown, rule-based coaching tips.

### Exam Workflow

- Add exams manually (name + date) or upload a syllabus PDF.
- PDF → `extractTextFromPdf` (pdfjs-dist) → `parseSyllabusExams` + `extractSyllabusTopics` (AI).
- Each exam has a checkable topic list; "Get a study tip" calls `getExamStudyTip`.

---

## Run Locally

```bash
cd react-app
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

Create `react-app/.env`:

### Firebase (required for live library data)

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

Without these, the app uses built-in Columbia libraries/spaces (no Firestore).

### AI (optional – fallback to demo responses)

```bash
# Anthropic (Claude) – checked first
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key

# OpenAI – used when Anthropic key is not set
VITE_OPENAI_API_KEY=sk-your-key
```

In dev, Vite proxies `/api/anthropic` to avoid CORS and keeps the API key on the server side.

---

## Seeding Firestore

To populate Firestore with Columbia libraries and spaces:

```bash
cd react-app
node src/firebase/seed_columbia_libraries.js.js /path/to/serviceAccountKey.json
```

Requires a Firebase service account key. Writes to `Libraries` collection with `library_name` and `spaces` subcollection containing `room_data` (space_name, space_capacity, space_counter, day counts).

---

## Demo for Judges

1. **Home** – Browse libraries, rate a space (pick space + crowdedness 1–5).
2. **Discover** – Pick intensity, noise, group size, duration. Click "Find me a spot" for AI-curated recommendations.
3. **Lock In** – Select task, energy, and your space. Start the timer (10 sec for quick demo). After reflection, click "Get a tip for next time" for AI advice.
4. **Stats** – Complete a few Lock In sessions first, then "Ask AI for weekly insights." Add an exam manually or upload a syllabus PDF. Open an exam to see the study to-do and "Get a study tip."

---

## Deploy

Configured for Vercel (`vercel.json`):

```bash
cd react-app
npm run build
```


