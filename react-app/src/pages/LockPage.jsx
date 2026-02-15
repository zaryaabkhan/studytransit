import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { getSessionCoachingSummary } from "../services/aiClient.js";
import {
  fetchAllSpacesFromLibrary,
  updateSpaceCapacityAndCounter,
} from "../firebase/firebase_utility.jsx";

export function LockPage() {
  const {
    state: { allSpaces = [], libraries },
    dispatch,
  } = useAppState();

  const [duration, setDuration] = useState(10); /* seconds, min 10 for demo */
  const [remaining, setRemaining] = useState(duration);
  const [timerState, setTimerState] = useState("idle"); // idle | running | completed
  const [taskType, setTaskType] = useState("");
  const [energy, setEnergy] = useState("");

  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState({ message: "", status: null });
  const [reflectionFocus, setReflectionFocus] = useState(3);
  const [postTip, setPostTip] = useState("");
  const [postTipLoading, setPostTipLoading] = useState(false);

  const intervalRef = useRef(null);
  const sessionRef = useRef(null);
  const lastCompletedSessionRef = useRef(null);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function configureSession() {
    const now = new Date();
    const durationMinutes = duration === 10 ? 10 : duration / 60;
    sessionRef.current = {
      id: `session-${now.getTime()}`,
      started_at: now.toISOString(),
      duration_minutes: durationMinutes,
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
    lastCompletedSessionRef.current = { ...sessionRef.current, completed: true, reflection: { focusRating: reflectionFocus } };
    completeSession(true, {
      focusRating: reflectionFocus,
    });
    setTimerState("idle");
    setRemaining(duration);
    setFeedback({ message: "Nice work! Reflection helps build better habits.", status: "success" });
    setReflectionFocus(3);
    setPostTip("");
  }

  function skipReflection() {
    if (!sessionRef.current) return;
    lastCompletedSessionRef.current = { ...sessionRef.current, completed: true };
    completeSession(true);
    setTimerState("idle");
    setRemaining(duration);
    setFeedback({ message: coachingCompletionMessage(), status: "success" });
    setPostTip("");
  }

  async function fetchPostTip() {
    const session = lastCompletedSessionRef.current;
    if (!session) return;
    setPostTipLoading(true);
    setPostTip("");
    try {
      const advice = await getSessionCoachingSummary(session, "");
      const firstTip = advice?.split("\n")[0]?.replace(/^[•\-\*]\s*/, "") || "Take a short break before your next block.";
      setPostTip(firstTip);
    } catch {
      setPostTip("Take a short break before your next block.");
    } finally {
      setPostTipLoading(false);
    }
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
    if (duration >= 120) {
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

  async function startTimer() {
    if (timerState === "running") return;
    if (!selectedSpaceId) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const [libraryId, spaceId] = selectedSpaceId.includes(":")
      ? selectedSpaceId.split(":", 2)
      : [undefined, selectedSpaceId];

    if (libraryId && spaceId) {
      try {
        const selectedSpace = allSpaces.find(
          (space) => space.id === spaceId && space.libraryId === libraryId
        );
        const incrementBy = Number(rating) || 0;
        const currentCapacity = Number(selectedSpace?.room_data?.space_capacity) || 0;
        const currentCounter = Number(selectedSpace?.room_data?.space_counter) || 0;

        await updateSpaceCapacityAndCounter(libraryId, spaceId, {
          space_capacity: currentCapacity + incrementBy,
          space_counter: currentCounter + 1,
        });

        const refreshedRawSpaces = await fetchAllSpacesFromLibrary(libraryId);
        const refreshedSpaces = refreshedRawSpaces.map((raw) => {
          const roomData = raw.room_data || {};
          return {
            id: raw.id,
            libraryId,
            name: roomData.space_name ?? "Space",
            capacity: Number(roomData.space_capacity) || 0,
            room_data: roomData,
          };
        });
        dispatch({
          type: "SET_SPACES_FOR_LIBRARY",
          payload: { libraryId, spaces: refreshedSpaces },
        });
      } catch (err) {
        console.error("Failed to increment space counters:", err);
      }
    }

    dispatch({
      type: "ADD_RATING",
      payload: {
        spaceId,
        ...(libraryId && { libraryId }),
        value: Number(rating),
        timestamp: new Date().toISOString(),
      },
    });

    setTimerState("running");
    setRemaining(duration);
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
    setRemaining(duration);
    completeSession(false);
    setFeedback({ message: "", status: null });
  }

  const totalSeconds = duration;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  const sortedSpaces = (allSpaces || [])
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
                min={10}
                max={180}
                step={10}
                value={duration}
                disabled={timerState === "running"}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="duration-value">{duration < 60 ? `${duration} sec` : `${Math.round(duration / 60)} min`}</div>
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
                  <option value="">Select mood</option>
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
                          <option key={`${s.libraryId}:${s.id}`} value={`${s.libraryId}:${s.id}`}>
                            {s.name}
                          </option>
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
            <>
              <button
                type="button"
                className="lock-ai-prompt-btn"
                onClick={fetchPostTip}
                disabled={postTipLoading}
              >
                {postTipLoading ? "Getting tip…" : "💡 Get a tip for next time"}
              </button>
              {postTip && <p className="lock-post-tip">{postTip}</p>}
              <button
                className="muted-button"
                type="button"
                onClick={() => { setFeedback({ message: "", status: null }); setPostTip(""); }}
              >
                Start another session
              </button>
            </>
          )}
        </section>
      </main>

    </div>
  );
}
