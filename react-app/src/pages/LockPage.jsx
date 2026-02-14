import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { getSessionCoachingSummary } from "../services/aiClient.js";

export function LockPage() {
  const {
    state: { spaces, libraries },
    dispatch,
  } = useAppState();

  const [duration, setDuration] = useState(10);
  const [remaining, setRemaining] = useState(duration * 60);
  const [timerState, setTimerState] = useState("idle"); // idle | running | completed
  const [taskType, setTaskType] = useState("");
  const [energy, setEnergy] = useState("");

  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState({ message: "", status: null });
  const [coachNotes, setCoachNotes] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const [reflectionFocus, setReflectionFocus] = useState(3);
  const [reflectionNote, setReflectionNote] = useState("");
  const [timerNotification, setTimerNotification] = useState("");

  const intervalRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    setRemaining(duration * 60);
  }, [duration]);

  const TIMER_MESSAGES = [
    "You got it",
    "Keep up the good work",
    "Get to work",
    "Stay focused",
    "You're doing great",
    "One step at a time",
    "Almost there",
    "Keep going",
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (timerState !== "running") {
      setTimerNotification("");
      return;
    }
    const pickMessage = () => TIMER_MESSAGES[Math.floor(Math.random() * TIMER_MESSAGES.length)];
    setTimerNotification(pickMessage());
    notificationIntervalRef.current = setInterval(() => {
      setTimerNotification(pickMessage());
    }, 90 * 1000); // every 90 seconds
    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, [timerState]);

  function configureSession() {
    const now = new Date();
    sessionRef.current = {
      id: `session-${now.getTime()}`,
      started_at: now.toISOString(),
      duration_minutes: duration,
      task: taskType || null,
      energy: energy || null,
      completed: false,
    };
  }

  function completeSession(completed, reflection = null) {
    if (!sessionRef.current) return;
    const finished = {
      ...sessionRef.current,
      completed,
      finished_at: new Date().toISOString(),
      ...(reflection && { reflection }),
    };
    dispatch({ type: "LOG_SESSION", payload: finished });
    sessionRef.current = null;
  }

  function submitReflection() {
    if (!sessionRef.current) return;
    completeSession(true, {
      focusRating: reflectionFocus,
      note: reflectionNote.trim() || null,
    });
    setTimerState("idle");
    setRemaining(duration * 60);
    setFeedback({ message: "Nice work! Reflection helps build better habits.", status: "success" });
    setReflectionFocus(3);
    setReflectionNote("");
  }

  function skipReflection() {
    if (!sessionRef.current) return;
    completeSession(true);
    setTimerState("idle");
    setRemaining(duration * 60);
    setFeedback({ message: coachingCompletionMessage(), status: "success" });
  }

  function coachingStartMessage() {
    if (taskType === "exam") {
      return "Locked in. Treat this like a sprint: no phones, short breaks, and write down tricky problems for review later.";
    }
    if (taskType === "reading") {
      return "Settle in. Skim first, then read with a pen in hand and capture one key idea per section.";
    }
    if (taskType === "writing") {
      return "Let it be messy. Aim for continuous writing now, revise in a later session.";
    }
    if (energy === "tired") {
      return "You’re starting tired—keep the session tight and reward yourself with a short walk when you’re done.";
    }
    if (energy === "energized") {
      return "You’ve got energy—use this block for your hardest work, not inbox or admin tasks.";
    }
    return "You’re in. One block at a time—focus on progress, not perfection.";
  }

  function coachingCompletionMessage() {
    if (duration >= 90) {
      return "That was a long block—take a 5-min walk or stretch before your next session. Your brain consolidates better with real breaks. " + (taskType === "exam" ? "Jot down 1–2 concepts that still feel shaky." : taskType === "reading" ? "Capture one sentence on what you learned." : taskType === "writing" ? "Leave a note for your future self." : "Nice work!");
    }
    if (taskType === "exam") {
      return "Nice work—before you move, jot down the 1–2 concepts that still feel shaky so future you knows where to focus.";
    }
    if (taskType === "reading") {
      return "Session complete. Capture one sentence on what you just learned before you switch contexts.";
    }
    if (taskType === "writing") {
      return "Done. Leave a quick note to your future self about what to do first next time you open this draft.";
    }
    return "Nice work! Your focus session is complete—take a short break before deciding what’s next.";
  }

  function startTimer() {
    if (timerState === "running") return;
    if (!selectedSpaceId) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    dispatch({
      type: "ADD_RATING",
      payload: { spaceId: selectedSpaceId, value: Number(rating), timestamp: new Date().toISOString() },
    });

    setTimerState("running");
    setRemaining(duration * 60);
    configureSession();
    setFeedback({ message: coachingStartMessage(), status: "success" });

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimerState("reflecting");
          setFeedback({ message: "Quick reflection — helps your brain consolidate", status: "success" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState("idle");
    setRemaining(duration * 60);
    completeSession(false);
    setFeedback({ message: "", status: null });
  }

  async function askCoach() {
    if (!sessionRef.current && timerState === "idle") {
      setCoachError("Start or complete a session first so the coach has something to react to.");
      return;
    }
    const session = sessionRef.current || {
      started_at: new Date().toISOString(),
      duration_minutes: duration,
      task: taskType || null,
      energy: energy || null,
    };

    setCoachLoading(true);
    setCoachError("");
    try {
      const advice = await getSessionCoachingSummary(session, "");
      setCoachNotes(advice);
    } catch (err) {
      setCoachError(err.message || "Unable to reach study coach right now.");
    } finally {
      setCoachLoading(false);
    }
  }

  const totalSeconds = duration * 60;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  const sortedSpaces = spaces
    .map((s) => ({
      ...s,
      libraryName: libraries.find((l) => l.id === s.libraryId)?.name || "",
    }))
    .sort((a, b) => a.libraryName.localeCompare(b.libraryName) || a.name.localeCompare(b.name));

  return (
    <div className="lock-screen">
      <header className="app-header lock-header-same">
        <div className="header-content">
          <h1 className="app-title">Lock In</h1>
          <p className="app-tagline">Focus mode · Stay present</p>
        </div>
      </header>

      <main className="lock-main">
        <section className="timer-card">
          <div className="timer-ring-wrapper">
            <svg className="timer-ring" viewBox="0 0 160 160">
              <circle className="timer-ring__background" cx="80" cy="80" r={radius}></circle>
              <circle
                className="timer-ring__progress"
                cx="80"
                cy="80"
                r={radius}
                style={{
                  strokeDasharray: `${circumference} ${circumference}`,
                  strokeDashoffset,
                }}
              ></circle>
            </svg>
            <div className="timer-display">
              {minutes}:{seconds}
            </div>
          </div>

          <div className="timer-controls">
            <label className="timer-label" htmlFor="duration-range">
              Study length
            </label>
            <div className="timer-duration">
              <input
                id="duration-range"
                type="range"
                min={5}
                max={180}
                step={5}
                value={duration}
                disabled={timerState === "running"}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="duration-value">{duration} minutes</div>
            </div>

            <div className="lock-context-grid">
              <div className="lock-context-field">
                <label htmlFor="task-type" className="timer-label">
                  What are you working on?
                </label>
                <select
                  id="task-type"
                  className="lock-context-select"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <option value="">Choose a focus</option>
                  <option value="exam">Exam prep / problem sets</option>
                  <option value="reading">Reading / notes</option>
                  <option value="writing">Writing / essays</option>
                  <option value="project">Project / group work</option>
                </select>
              </div>
              <div className="lock-context-field">
                <label htmlFor="energy-level" className="timer-label">
                  How are you feeling?
                </label>
                <select
                  id="energy-level"
                  className="lock-context-select"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                >
                  <option value="">Energy check</option>
                  <option value="tired">Pretty tired</option>
                  <option value="ok">Okay</option>
                  <option value="energized">Energized</option>
                </select>
              </div>
            </div>

            <div className="lock-room-rating-section">
              <label className="timer-label">Rate the room you&apos;re in</label>
              <div className="lock-room-row">
                <select
                  className="lock-context-select lock-room-select"
                  value={selectedSpaceId || ""}
                  onChange={(e) => setSelectedSpaceId(e.target.value || null)}
                >
                  <option value="">Select your space</option>
                  {libraries.map((lib) => {
                    const libSpaces = sortedSpaces.filter((s) => s.libraryId === lib.id);
                    if (!libSpaces.length) return null;
                    return (
                      <optgroup key={lib.id} label={lib.name}>
                        {libSpaces.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="lock-rating-inline">
                  <span className="lock-rating-label">How full? {rating}/5</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="lock-rating-slider"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lock-actions">
          {timerNotification && timerState === "running" && (
            <div className="lock-timer-notification" role="status">
              {timerNotification}
            </div>
          )}
          {feedback.message && (
            <div className="survey-callout is-visible" data-status={feedback.status || ""}>
              {feedback.message}
            </div>
          )}
          <button
            className="primary-button"
            type="button"
            onClick={startTimer}
            disabled={timerState === "running" || !taskType || !energy || !selectedSpaceId}
          >
            {timerState === "completed" ? "Session complete!" : "Turn On Focus Mode"}
          </button>
          {(!taskType || !energy || !selectedSpaceId) && timerState === "idle" && (
            <p className="lock-required-hint">
              Select task, energy, and rate your room to start
            </p>
          )}
          <div className="button-separator">
            <span className="separator-line"></span>
            <span className="separator-text">OR</span>
            <span className="separator-line"></span>
          </div>
          <button className="primary-outline-button" type="button" onClick={askCoach}>
            {coachLoading ? "Asking coach..." : "Ask AI study coach"}
          </button>
          {timerState === "running" && (
            <button className="muted-button" type="button" onClick={cancelTimer}>
              Cancel session
            </button>
          )}
          {timerState === "reflecting" && (
            <div className="reflection-panel">
              <h3 className="reflection-title">How focused did you feel?</h3>
              <div className="reflection-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`reflection-rating-btn ${reflectionFocus === n ? "active" : ""}`}
                    onClick={() => setReflectionFocus(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="reflection-rating-caption">1 = distracted · 5 = laser-focused</p>
              <input
                type="text"
                placeholder="One thing that helped or distracted? (optional)"
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                className="reflection-note"
              />
              <div className="reflection-actions">
                <button type="button" className="primary-button" onClick={submitReflection}>
                  Done
                </button>
                <button type="button" className="muted-button" onClick={skipReflection}>
                  Skip
                </button>
              </div>
            </div>
          )}
          {(timerState === "idle" && feedback.status === "success") && (
            <button
              className="muted-button"
              type="button"
              onClick={() => setFeedback({ message: "", status: null })}
            >
              Start another session
            </button>
          )}
        </section>
      </main>

      {(coachNotes || coachError) && (
        <section className="coach-panel">
          <h2 className="coach-title">Coach suggestions</h2>
          {coachError && <p className="coach-error">{coachError}</p>}
          {coachNotes && (
            <div className="coach-body">
              {coachNotes.split("\n").map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}

