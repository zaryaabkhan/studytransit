import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { getWeeklyStudyInsights } from "../services/aiClient.js";

export function StatsPage() {
  const {
    state: { focusSessions, weeklyGoalMinutes, exams },
    dispatch,
  } = useAppState();

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [showAddExam, setShowAddExam] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const { weeklyMinutes, completedSessions, recentCompleted, studyStreak } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const recent = focusSessions.filter((s) => {
      if (!s.started_at || !s.completed) return false;
      const t = new Date(s.started_at);
      return t >= weekAgo && t <= now;
    });

    const completed = recent.filter((s) => s.completed);
    const minutes = completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Study streak: consecutive days (including today) with at least 1 completed session
    const daysWithSessions = new Set();
    completed.forEach((s) => {
      const d = new Date(s.started_at);
      daysWithSessions.add(d.toDateString());
    });

    let streak = 0;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const key = new Date(today);
      key.setDate(key.getDate() - i);
      if (daysWithSessions.has(key.toDateString())) streak++;
      else break; /* streak ends on first day without a session (including today) */
    }

    return {
      weeklyMinutes: Math.round(minutes),
      completedSessions: completed.length,
      recentCompleted: completed,
      studyStreak: streak,
    };
  }, [focusSessions]);

  const taskBreakdown = useMemo(() => {
    const counts = {};
    recentCompleted.forEach((s) => {
      const task = s.task || "general";
      counts[task] = (counts[task] || 0) + 1;
    });
    return counts;
  }, [recentCompleted]);

  const taskLabels = {
    exam: "Exam prep / problem sets",
    reading: "Reading / notes",
    writing: "Writing / essays",
    project: "Projects / group work",
    general: "General focus",
  };

  const { bestTimeInsight, balanceInsight } = useMemo(() => {
    let bestTime = null;
    let balance = null;

    if (recentCompleted.length >= 3) {
      const morning = recentCompleted.filter((s) => {
        const h = new Date(s.started_at).getHours();
        return h >= 6 && h < 12;
      });
      const afternoon = recentCompleted.filter((s) => {
        const h = new Date(s.started_at).getHours();
        return h >= 12 && h < 18;
      });
      const evening = recentCompleted.filter((s) => {
        const h = new Date(s.started_at).getHours();
        return h >= 18 || h < 6;
      });
      const max = Math.max(morning.length, afternoon.length, evening.length);
      if (max === morning.length && morning.length > 0)
        bestTime = "You complete most sessions in the morning—your peak focus time.";
      else if (max === afternoon.length && afternoon.length > 0)
        bestTime = "Afternoon is when you get most done—schedule harder work then.";
      else if (max === evening.length && evening.length > 0)
        bestTime = "Evening works for you—protect that window with shorter, focused blocks.";
    }

    if (recentCompleted.length >= 2 && Object.keys(taskBreakdown).length >= 1) {
      const total = recentCompleted.length;
      const dominant = Object.entries(taskBreakdown).sort((a, b) => b[1] - a[1])[0];
      const pct = Math.round((dominant[1] / total) * 100);
      if (pct >= 70) {
        const others = ["reading", "writing", "exam", "project"].filter((t) => t !== dominant[0]);
        const suggested = others[Math.floor(Math.random() * others.length)];
        balance = `${pct}% ${taskLabels[dominant[0]] || dominant[0]} this week. Consider adding a ${taskLabels[suggested] || suggested} block for balance.`;
      }
    }

    return { bestTimeInsight: bestTime, balanceInsight: balance };
  }, [recentCompleted, taskBreakdown]);

  const coachingTips = useMemo(() => {
    const tips = [];
    if (!recentCompleted.length) return tips;

    if (bestTimeInsight) tips.push(bestTimeInsight);
    if (balanceInsight) tips.push(balanceInsight);

    if (weeklyMinutes < 120) {
      tips.push(
        "You're just getting started—try scheduling one more short Lock In block this week and treat it like an appointment."
      );
    } else if (weeklyMinutes > 480) {
      tips.push(
        "You're putting in serious time—protect your energy with real breaks away from screens between longer sessions."
      );
    } else {
      tips.push(
        "You've built a solid baseline—consider pairing one harder Lock In block with a lighter one each day."
      );
    }

    const lateSessions = recentCompleted.filter((s) => {
      const t = new Date(s.started_at);
      const h = t.getHours();
      return h >= 22 || h < 7;
    });
    if (lateSessions.length >= 2) {
      tips.push(
        "A lot of your focus time is late at night—experiment with shifting one of those blocks earlier to see if you feel clearer."
      );
    }

    const tiredSessions = recentCompleted.filter((s) => s.energy === "tired");
    if (tiredSessions.length >= 3) {
      tips.push(
        "You often start sessions tired—try a 5‑minute walk or stretch before Lock In to give your brain a head start."
      );
    }

    return tips;
  }, [recentCompleted, weeklyMinutes, bestTimeInsight, balanceInsight]);

  const goalProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100));

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingExams = exams.filter((e) => new Date(e.date) >= now).slice(0, 5);

  function daysUntil(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - now) / (24 * 60 * 60 * 1000));
  }

  function suggestedMinutes(days) {
    if (days <= 0) return 0;
    if (days <= 7) return 90;
    if (days <= 14) return 60;
    return 45;
  }

  function addExam(e) {
    e.preventDefault();
    const d = new Date(examDate);
    if (examName.trim() && !isNaN(d.getTime())) {
      dispatch({ type: "ADD_EXAM", payload: { name: examName.trim(), date: d.toISOString().slice(0, 10) } });
      setExamName("");
      setExamDate("");
      setShowAddExam(false);
    }
  }

  function setGoal(e) {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (val >= 30 && val <= 600) {
      dispatch({ type: "SET_WEEKLY_GOAL", payload: val });
      setGoalInput("");
    }
  }

  async function handleAskInsights() {
    setAiLoading(true);
    setAiError("");
    try {
      const summaryLines = recentCompleted.length
        ? [
            `Weekly focused minutes: ${weeklyMinutes}`,
            `Completed sessions: ${completedSessions}`,
            "Task breakdown:",
            ...Object.entries(taskBreakdown).map(
              ([task, count]) => `- ${taskLabels[task] || taskLabels.general}: ${count}`
            ),
          ].join("\n")
        : "No sessions yet this week.";
      const text = await getWeeklyStudyInsights(summaryLines);
      setAiSummary(text);
    } catch (err) {
      setAiError(err.message || "Unable to reach AI insights right now.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Stats</h1>
          <p className="app-tagline">Your study dashboard</p>
        </div>
      </header>
      <main className="stats-main">
        <section className="stats-section stats-exams-section">
          <h2 className="stats-section-title">Upcoming exams</h2>
          {upcomingExams.length > 0 ? (
            <>
              <ul className="stats-exam-list">
                {upcomingExams.map((exam) => {
                  const days = daysUntil(exam.date);
                  const suggested = suggestedMinutes(days);
                  return (
                    <li key={exam.id} className="stats-exam-item">
                      <div className="stats-exam-main">
                        <span className="stats-exam-name">{exam.name}</span>
                        <span className="stats-exam-days">{days} {days === 1 ? "day" : "days"} left</span>
                      </div>
                      <p className="stats-exam-tip">Aim for ~{suggested} min this week (spaced practice)</p>
                      <button type="button" className="stats-exam-remove" onClick={() => dispatch({ type: "REMOVE_EXAM", payload: exam.id })} aria-label="Remove">×</button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="primary-outline-button stats-exam-add" onClick={() => setShowAddExam(true)}>
                Add exam
              </button>
            </>
          ) : (
            <button type="button" className="muted-button stats-exam-add" onClick={() => setShowAddExam(true)}>
              Add an exam to get study reminders
            </button>
          )}
        </section>

        {showAddExam && (
          <div className="exam-add-modal">
            <div className="exam-add-backdrop" onClick={() => setShowAddExam(false)} />
            <div className="exam-add-dialog">
              <h2 className="exam-add-title">Add exam</h2>
              <form onSubmit={addExam} className="exam-add-form">
                <input
                  type="text"
                  placeholder="Exam name (e.g. CS midterm)"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="exam-add-input"
                  autoFocus
                />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="exam-add-input"
                  required
                />
                <div className="exam-add-actions">
                  <button type="submit" className="primary-button">Add</button>
                  <button type="button" className="muted-button" onClick={() => setShowAddExam(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="stats-summary">
          <div className="stats-card stats-card-highlight">
            <div className="stats-label">Study streak</div>
            <div className="stats-value stats-value-streak">{studyStreak} days</div>
            <div className="stats-caption">Consecutive days with completed sessions</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">This week</div>
            <div className="stats-value">{weeklyMinutes} min</div>
            <div className="stats-caption">Focused study time</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">Sessions done</div>
            <div className="stats-value">{completedSessions}</div>
            <div className="stats-caption">Completed Lock In blocks</div>
          </div>
        </section>

        <section className="stats-section">
          <h2 className="stats-section-title">Weekly goal</h2>
          <div className="stats-goal-bar">
            <div className="stats-goal-fill" style={{ width: `${goalProgress}%` }} />
          </div>
          <p className="stats-goal-text">
            {weeklyMinutes} / {weeklyGoalMinutes} min
          </p>
          <form onSubmit={setGoal} className="stats-goal-form">
            <input
              type="number"
              min={30}
              max={600}
              step={30}
              placeholder="Set goal (e.g. 300)"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="stats-goal-input"
            />
            <button type="submit" className="primary-button stats-goal-btn">
              Set weekly goal (min)
            </button>
          </form>
        </section>

        <section className="stats-section">
          <h2 className="stats-section-title">How you've been studying</h2>
          <ul className="stats-list">
            {recentCompleted.length === 0 ? (
              <li className="stats-empty">
                Finish a few sessions in Lock In to see your patterns.
              </li>
            ) : (
              Object.entries(taskBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([task, count]) => (
                  <li key={task} className="stats-item">
                    {taskLabels[task] || taskLabels.general}: {count} session
                    {count === 1 ? "" : "s"}
                  </li>
                ))
            )}
          </ul>
        </section>

        <section className="stats-section">
          {recentCompleted.length === 0 && (
            <button
              type="button"
              className="muted-button stats-demo-btn"
              onClick={() => dispatch({ type: "SEED_DEMO_DATA" })}
            >
              Load demo data (for judges)
            </button>
          )}
          <h2 className="stats-section-title">AI study coach</h2>
          <ul className="stats-list">
            {coachingTips.length === 0 ? (
              <li className="stats-empty">
                Complete sessions to unlock rule-based nudges.
              </li>
            ) : (
              coachingTips.map((tip, idx) => (
                <li key={idx} className="stats-item">
                  {tip}
                </li>
              ))
            )}
          </ul>

          <button
            type="button"
            className="primary-outline-button stats-ai-button"
            onClick={handleAskInsights}
            disabled={aiLoading}
          >
            {aiLoading ? "Generating..." : "Ask AI for weekly insights"}
          </button>

          {(aiSummary || aiError) && (
            <div className="stats-ai-panel">
              {aiError && <p className="stats-ai-error">{aiError}</p>}
              {aiSummary && (
                <div className="stats-ai-body">
                  {aiSummary.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
