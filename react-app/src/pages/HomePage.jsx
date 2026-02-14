import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";

export function HomePage() {
  const {
    state: { libraries, exams },
    dispatch,
  } = useAppState();

  const [showAddExam, setShowAddExam] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingExams = exams.filter((e) => new Date(e.date) >= now).slice(0, 3);

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

  function removeExam(id) {
    dispatch({ type: "REMOVE_EXAM", payload: id });
  }

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

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Lion Study</h1>
          <p className="app-tagline">Columbia Libraries · Find your spot</p>
        </div>
      </header>
      <main className="library-list">
        {upcomingExams.length > 0 && (
          <section className="exam-countdown-section">
            <h2 className="exam-countdown-title">Upcoming exams</h2>
            {upcomingExams.map((exam) => {
              const days = daysUntil(exam.date);
              const suggested = suggestedMinutes(days);
              return (
                <div key={exam.id} className="exam-countdown-card">
                  <div className="exam-countdown-main">
                    <span className="exam-countdown-name">{exam.name}</span>
                    <span className="exam-countdown-days">{days} {days === 1 ? "day" : "days"} left</span>
                  </div>
                  <p className="exam-countdown-tip">Aim for ~{suggested} min this week (spaced practice)</p>
                  <button type="button" className="exam-countdown-remove" onClick={() => removeExam(exam.id)} aria-label="Remove">×</button>
                </div>
              );
            })}
            <button type="button" className="exam-countdown-add" onClick={() => setShowAddExam(true)}>
              + Add exam date
            </button>
          </section>
        )}

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

        {upcomingExams.length === 0 && (
          <button type="button" className="exam-countdown-cta" onClick={() => setShowAddExam(true)}>
            Add an exam to get study reminders
          </button>
        )}

        <h2 className="library-list-title">Libraries</h2>
        {libraries.map((library) => (
          <Link key={library.id} to={`/libraries/${library.id}`} className="library-card">
            <div className="library-name">{library.name}</div>
            {library.location && <div className="library-location">{library.location}</div>}
          </Link>
        ))}
      </main>
    </>
  );
}

