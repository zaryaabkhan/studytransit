// AI client for StudyTransit – Education track.
// Uses Anthropic (Claude) when VITE_ANTHROPIC_API_KEY is set, then OpenAI when
// VITE_OPENAI_API_KEY is set; otherwise returns demo responses.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL =
  import.meta.env.DEV ? "/api/anthropic/v1/messages" : "https://api.anthropic.com/v1/messages";
const OPENAI_MODEL = "gpt-4o-mini";
const ANTHROPIC_MODEL = "claude-3-haiku-20240307";

function getAnthropicKey() {
  return (import.meta.env.VITE_ANTHROPIC_API_KEY || "").trim();
}

function getOpenAIKey() {
  return import.meta.env.VITE_OPENAI_API_KEY || "";
}

function getApiKey() {
  return getAnthropicKey() || getOpenAIKey();
}

function isDemoMode() {
  const key = getApiKey();
  return !key || key.length < 10;
}

function useClaude() {
  const key = getAnthropicKey();
  return key && key.length >= 10;
}

async function callChatClaude(messages, options = {}) {
  const apiKey = getAnthropicKey();
  if (!apiKey || apiKey.length < 20) {
    throw new Error(
      "API key not loaded. Ensure VITE_ANTHROPIC_API_KEY is in react-app/.env, save the file, then restart: npm run dev"
    );
  }

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsg = messages.find((m) => m.role === "user");
  const system = systemMsg?.content || "";
  const userContent = userMsg?.content || "";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(import.meta.env.DEV
        ? {}
        : {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          }),
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: options.maxTokens ?? 1024,
      system,
      messages: [{ role: "user", content: userContent }],
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = "";
    try {
      const err = JSON.parse(text);
      detail = err.error?.message || err.message || text.slice(0, 200);
    } catch {
      detail = text.slice(0, 200);
    }
    if (response.status === 401) {
      throw new Error(
        "Invalid API key (401). " +
        (detail ? `API says: ${detail}. ` : "") +
        "Create a new key at console.anthropic.com → API keys, copy it when shown (you only see it once), and add to react-app/.env as VITE_ANTHROPIC_API_KEY=your-key"
      );
    }
    throw new Error(`Claude API failed: ${response.status}. ${detail || text}`);
  }

  const data = await response.json();
  const block = data.content?.find((b) => b.type === "text");
  return block?.text?.trim() ?? "";
}

async function callChatOpenAI(messages, options = {}) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 400,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callChat(messages, options = {}) {
  if (isDemoMode()) {
    return null; // Caller will use getDemoSessionCoaching / getDemoWeeklyInsights
  }

  if (useClaude()) {
    return callChatClaude(messages, options);
  }
  return callChatOpenAI(messages, options);
}

// Demo responses when no API key – so judges see AI features work
function getDemoSessionCoaching(session) {
  const task = session.task || "general";
  const energy = session.energy || "ok";
  const dur = session.duration_minutes || 60;

  const tips = [];

  if (task === "exam" || task === "problem_sets") {
    tips.push("• Treat this as a sprint: close distracting tabs and put your phone face-down.");
    tips.push("• Use retrieval practice: pause every 20 min and quiz yourself on key concepts.");
    tips.push("• Jot down 1–2 concepts that feel shaky so you can review them later.");
    tips.push("• Take a real break between sessions—your brain consolidates better with rest.");
  } else if (task === "reading") {
    tips.push("• Skim headings first, then read with a pen – capture one takeaway per section.");
    tips.push("• Try the Feynman technique: explain what you read in simple terms.");
    tips.push("• Stand and stretch every 25 minutes to stay fresh.");
  } else if (task === "writing") {
    tips.push("• Draft first, edit later. Aim for continuous writing, not perfection.");
    tips.push("• Leave a one-line note for future-you about where to pick up next.");
    tips.push("• Silence notifications and reward yourself with a short walk when done.");
  } else {
    tips.push("• One block at a time – focus on progress, not perfection.");
    tips.push("• Small consistent sessions build lasting habits better than long cramming.");
  }

  if (energy === "tired") {
    tips.push("• Short sessions are fine. Take a 5‑minute walk after this block.");
  } else if (energy === "energized") {
    tips.push("• Use this energy for your hardest task – save admin for later.");
  }

  if (dur > 60) {
    tips.push(`• For a ${dur}-min block, plan one 5‑min micro-break at the halfway point.`);
  }

  return tips.join("\n");
}

function getDemoWeeklyInsights(summary) {
  const hasData = summary && summary.includes("Weekly");
  if (!hasData) {
    return "• Complete a few Lock In sessions, then ask again for personalized insights.\n• Tip: Even 15-minute focused blocks count—start small and build from there.";
  }

  return [
    "• You're building a solid study habit – consistency beats intensity.",
    "• Try pairing your hardest task with your peak energy time (check when you complete sessions).",
    "• If you study late often, experiment with one morning block this week.",
    "• Schedule study like a class: block it on your calendar and protect it.",
    "• Small wins add up – celebrate finishing sessions, not just outcomes.",
    "• Protect your rest: sleep and breaks are when your brain does its best work.",
  ].join("\n");
}

export async function getSessionCoachingSummary(session, context) {
  const apiKey = getApiKey();
  if (apiKey && apiKey.length >= 10) {
    const content = [
      `Task type: ${session.task || "unspecified"}`,
      `Duration: ${session.duration_minutes} minutes`,
      `Energy at start: ${session.energy || "unspecified"}`,
      context ? `Extra context: ${context}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await callChat([
        {
          role: "system",
          content:
            "You are a concise, evidence-informed study coach for university students. " +
            "Give practical, non-judgmental advice in 3–5 short bullet points. Avoid filler.",
        },
        {
          role: "user",
          content:
            "Based on this planned or completed study session, suggest how the student can " +
            "make the most of it and what to tweak next time:\n\n" + content,
        },
      ]);
      if (result) return result;
    } catch {
      // Fall through to demo
    }
  }

  return getDemoSessionCoaching(session);
}

export async function getAISpaceRecommendations(preferences, spaces, libraries) {
  const apiKey = getApiKey();
  if (apiKey && apiKey.length >= 10) {
    try {
      const spaceList = spaces
        .map((s) => {
          const lib = libraries.find((l) => l.id === s.libraryId);
          return `${s.name} (${lib?.name ?? "Library"})`;
        })
        .join("\n");

      const content = `Student preferences:\n${JSON.stringify(preferences, null, 2)}\n\nAvailable spaces:\n${spaceList}\n\nReturn 3-5 space names (exact match) as a JSON array of objects: [{"space": "Space Name", "library": "Library Name", "reason": "one sentence why"}]`;

      const result = await callChat(
        [
          {
            role: "system",
            content:
              "You are a study space advisor for university students. Recommend 3-5 spaces from the list that best match the student's preferences. Return only valid JSON array.",
          },
          { role: "user", content },
        ],
        { temperature: 0.5, maxTokens: 500 }
      );
      if (result) {
        try {
          const match = result.match(/\[[\s\S]*\]/);
          if (match) {
            return JSON.parse(match[0]);
          }
        } catch {
          /* fall through to demo */
        }
      }
    } catch {
      /* fall through to demo */
    }
  }

  // Demo: return rule-based matches from spaces
  const { intensity = "steady", noise = "quiet", query = "" } = preferences;
  const q = (query || "").toLowerCase();
  const filtered = spaces.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const lib = libraries.find((l) => l.id === s.libraryId);
    const libName = (lib?.name || "").toLowerCase();
    if (q.match(/quiet|silent|focus/)) return name.includes("quiet") || name.includes("room");
    if (q.match(/group|social/)) return name.includes("group") || name.includes("main");
    return true;
  });
  return filtered.slice(0, 5).map((s) => {
    const lib = libraries.find((l) => l.id === s.libraryId);
    return {
      space: s.name,
      library: lib?.name ?? "Library",
      reason: `${lib?.name} – ${s.name} matches your ${intensity} work style and ${noise} preference.`,
    };
  });
}

export async function getWeeklyStudyInsights(summary) {
  const apiKey = getApiKey();
  if (apiKey && apiKey.length >= 10) {
    try {
      const result = await callChat([
        {
          role: "system",
          content:
            "You are a data-savvy academic coach. Interpret study stats and return 3–5 " +
            "specific, actionable suggestions. Be concrete and student-friendly.",
        },
        {
          role: "user",
          content:
            "Here is a student's last-week study summary. Explain what they're doing well and " +
            "give suggestions on schedule, environment, and routines.\n\n" + summary,
        },
      ]);
      if (result) return result;
    } catch {
      // Fall through to demo
    }
  }

  return getDemoWeeklyInsights(summary);
}

/**
 * Parse a syllabus (text) and extract exam/midterm dates using Claude.
 * Returns array of { name: string, date: string (YYYY-MM-DD) } or empty array.
 */
export async function parseSyllabusExams(syllabusText) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API key needed. Add VITE_ANTHROPIC_API_KEY to .env for syllabus parsing.");
  }

  const result = await callChat(
    [
      {
        role: "system",
        content:
          "You extract exam and midterm dates from course syllabi. " +
          "Return ONLY a valid JSON array of objects, no other text. " +
          "Each object must have: name (string, e.g. 'Midterm 1' or 'CS 101 Final'), date (string in YYYY-MM-DD format). " +
          "Use the current year for dates if only month/day given. Infer dates from context (e.g. 'Week 6' = approximate). " +
          "Skip assignment due dates; focus on exams, midterms, finals. If no exams found, return [].",
      },
      {
        role: "user",
        content:
          "Extract all exam and midterm dates from this syllabus. Return a JSON array only.\n\n" +
          syllabusText.slice(0, 15000),
      },
    ],
    { temperature: 0.2, maxTokens: 800 }
  );

  if (!result) return [];

  try {
    const match = result.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.name === "string" && x.date)
        .map((x) => ({
          name: String(x.name).trim(),
          date: String(x.date).trim().slice(0, 10),
        }))
        .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date));
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

/**
 * Extract study topics/todos from syllabus text using Claude.
 * Returns array of { id, text, recommended } (recommended=true when we couldn't parse from syllabus).
 */
export async function extractSyllabusTopics(syllabusText, examName) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 10) {
    return getDefaultStudyTopics(examName);
  }

  try {
    const result = await callChat(
      [
        {
          role: "system",
          content:
            "You extract key topics, modules, or units that a student should study for an exam from course syllabi. " +
            "Return ONLY a valid JSON array of strings, each a study topic (e.g. 'Unit 3: Derivatives', 'Chapter 5: Cell biology'). " +
            "Limit to 5-12 topics. If the syllabus has a clear outline or table of contents, use that. " +
            "If unclear, infer from headings and section titles. No other text.",
        },
        {
          role: "user",
          content: `Extract study topics for "${examName}" from this syllabus. Return a JSON array of strings only.\n\n` + syllabusText.slice(0, 12000),
        },
      ],
      { temperature: 0.3, maxTokens: 600 }
    );

    if (!result) return getDefaultStudyTopics(examName);

    const match = result.match(/\[[\s\S]*?\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.filter((x) => typeof x === "string" && x.trim()).map((text, i) => ({
          id: `topic-${i}`,
          text: String(text).trim(),
          recommended: false,
        }));
      }
    }
  } catch {
    /* fall through */
  }
  return getDefaultStudyTopics(examName);
}

export function getDefaultStudyTopics(examName) {
  return [
    { id: "t1", text: "Review main concepts from lectures", recommended: true },
    { id: "t2", text: "Practice problems from homework", recommended: true },
    { id: "t3", text: "Key definitions and terminology", recommended: true },
    { id: "t4", text: "Past exam or practice tests", recommended: true },
    { id: "t5", text: "Readings from syllabus", recommended: true },
  ];
}

/**
 * Returns a short AI-generated focus prompt before a session (1 sentence).
 */
export async function getFocusPrompt(taskType, energy, durationMinutes) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 10) {
    const fallbacks = {
      exam: "One session, one concept. Nail it.",
      reading: "Skim first, then read with intent.",
      writing: "Draft now, polish later.",
      project: "One small win in this block.",
    };
    return fallbacks[taskType] || "Focus on progress, not perfection.";
  }

  try {
    const result = await callChat(
      [
        {
          role: "system",
          content:
            "You are a study coach. Give exactly ONE short, punchy sentence (max 10 words) to help a student focus before a study session. No quotes, no filler.",
        },
        {
          role: "user",
          content: `Task: ${taskType || "general focus"}. Energy: ${energy || "ok"}. Duration: ${durationMinutes || 25} min. One sentence only.`,
        },
      ],
      { temperature: 0.8, maxTokens: 60 }
    );
    return result?.trim() || "One block at a time.";
  } catch {
    return "One block at a time.";
  }
}

/**
 * Returns one contextual study tip for an upcoming exam.
 */
export async function getExamStudyTip(examName, daysLeft, topicNames = []) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 10) {
    if (daysLeft <= 3) return "Focus on practice problems and key formulas—rereading notes is less effective now.";
    if (daysLeft <= 7) return "Spaced practice: review in 2–3 short sessions rather than one long cram.";
    return "Build habits early: 20–30 min daily beats last-minute marathon studying.";
  }

  try {
    const topics = topicNames.length ? topicNames.join(", ") : "general prep";
    const result = await callChat(
      [
        {
          role: "system",
          content:
            "You are a study coach. Give ONE concrete, actionable tip for this exam (1–2 sentences max). Be specific to the timeframe.",
        },
        {
          role: "user",
          content: `Exam: ${examName}. Days until exam: ${daysLeft}. Topics to study: ${topics}. One short tip.`,
        },
      ],
      { temperature: 0.6, maxTokens: 120 }
    );
    return result?.trim() || "Focus on active recall—test yourself instead of just rereading.";
  } catch {
    return "Focus on active recall—test yourself instead of just rereading.";
  }
}
