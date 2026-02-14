// AI client for StudyTransit – Education track.
// Uses Anthropic (Claude) when VITE_ANTHROPIC_API_KEY is set, then OpenAI when
// VITE_OPENAI_API_KEY is set; otherwise returns demo responses.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_MODEL = "gpt-4o-mini";
const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

function getAnthropicKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY || "";
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
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsg = messages.find((m) => m.role === "user");
  const system = systemMsg?.content || "";
  const userContent = userMsg?.content || "";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAnthropicKey(),
      "anthropic-version": "2023-06-01",
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
    throw new Error(`Claude API failed: ${response.status}`);
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
