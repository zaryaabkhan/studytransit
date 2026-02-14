// AI client for Lion Study – Education track.
// Uses OpenAI when VITE_OPENAI_API_KEY is set; otherwise returns demo responses
// so AI features work for judging without an API key.

const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

function getApiKey() {
  return import.meta.env.VITE_OPENAI_API_KEY || "";
}

function isDemoMode() {
  return !getApiKey() || getApiKey().length < 10;
}

async function callChat(messages, options = {}) {
  if (isDemoMode()) {
    return null; // Caller will use getDemoSessionCoaching / getDemoWeeklyInsights
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 400,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
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
  } else if (task === "reading") {
    tips.push("• Skim headings first, then read with a pen – capture one takeaway per section.");
    tips.push("• Try the Feynman technique: explain what you read in simple terms.");
  } else if (task === "writing") {
    tips.push("• Draft first, edit later. Aim for continuous writing, not perfection.");
    tips.push("• Leave a one-line note for future-you about where to pick up next.");
  } else {
    tips.push("• One block at a time – focus on progress, not perfection.");
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
    return "• Complete a few Lock In sessions, then ask again for personalized insights.";
  }

  return [
    "• You're building a solid study habit – consistency beats intensity.",
    "• Try pairing your hardest task with your peak energy time (check when you complete sessions).",
    "• If you study late often, experiment with one morning block this week.",
    "• Schedule study like a class: block it on your calendar and protect it.",
    "• Small wins add up – celebrate finishing sessions, not just outcomes.",
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
