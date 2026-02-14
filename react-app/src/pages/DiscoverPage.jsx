import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";
import { useSpaceRecommendations } from "../hooks/useRecommender.js";
import { getAISpaceRecommendations } from "../services/aiClient.js";

export function DiscoverPage() {
  const [form, setForm] = useState({
    intensity: "steady",
    noise: "quiet",
    groupSize: 1,
    duration: 60,
    q: "",
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const {
    state: { spaces, libraries, ratings },
  } = useAppState();

  const prefs = useMemo(
    () => ({
      intensity: form.intensity,
      noise: form.noise,
      groupSize: form.groupSize,
      duration: form.duration,
      query: form.q,
    }),
    [form]
  );

  const recommendations = useSpaceRecommendations(prefs);

  const ratingSummaryBySpace = useMemo(() => {
    const map = new Map();
    ratings.forEach((r) => {
      const entry = map.get(r.spaceId) || { sum: 0, count: 0, last: null };
      entry.sum += Number(r.value || 0);
      entry.count += 1;
      entry.last = r;
      map.set(r.spaceId, entry);
    });
    const result = new Map();
    map.forEach((entry, spaceId) => {
      const avg = entry.count ? Math.round((entry.sum / entry.count) * 100) / 100 : null;
      result.set(spaceId, { avg, last: entry.last });
    });
    return result;
  }, [ratings]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Recommendations recompute automatically via hook.
  }

  const aiResultsRef = React.useRef(null);

  async function handleAISuggestions() {
    setAiLoading(true);
    setAiError("");
    setAiSuggestions([]);
    try {
      const prefs = {
        intensity: form.intensity,
        noise: form.noise,
        groupSize: Number(form.groupSize) || 1,
        duration: Number(form.duration) || 60,
        query: form.q.trim(),
      };
      const results = await getAISpaceRecommendations(prefs, spaces, libraries);
      setAiSuggestions(Array.isArray(results) ? results : []);
      setTimeout(() => aiResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setAiError(err.message || "Could not get AI suggestions.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Discover</h1>
          <p className="app-tagline">AI-powered study space finder</p>
        </div>
      </header>
      <main className="discover-main">
        <section className="discover-preferences">
          <form className="discover-form" onSubmit={handleSubmit}>
            <div className="discover-section">
              <h2 className="discover-section-title">How do you want to study?</h2>
              <div className="discover-pill-group">
                <input
                  type="radio"
                  id="intensity-deep"
                  name="intensity"
                  value="deep"
                  className="discover-pill-input"
                  checked={form.intensity === "deep"}
                  onChange={handleChange}
                />
                <label htmlFor="intensity-deep" className="discover-pill-label">
                  Deep focus
                </label>

                <input
                  type="radio"
                  id="intensity-steady"
                  name="intensity"
                  value="steady"
                  className="discover-pill-input"
                  checked={form.intensity === "steady"}
                  onChange={handleChange}
                />
                <label htmlFor="intensity-steady" className="discover-pill-label">
                  Steady work
                </label>

                <input
                  type="radio"
                  id="intensity-social"
                  name="intensity"
                  value="social"
                  className="discover-pill-input"
                  checked={form.intensity === "social"}
                  onChange={handleChange}
                />
                <label htmlFor="intensity-social" className="discover-pill-label">
                  Group / social
                </label>
              </div>
            </div>

            <div className="discover-section">
              <h2 className="discover-section-title">Noise level</h2>
              <div className="discover-pill-group">
                <input
                  type="radio"
                  id="noise-silent"
                  name="noise"
                  value="silent"
                  className="discover-pill-input"
                  checked={form.noise === "silent"}
                  onChange={handleChange}
                />
                <label htmlFor="noise-silent" className="discover-pill-label">
                  Silent
                </label>

                <input
                  type="radio"
                  id="noise-quiet"
                  name="noise"
                  value="quiet"
                  className="discover-pill-input"
                  checked={form.noise === "quiet"}
                  onChange={handleChange}
                />
                <label htmlFor="noise-quiet" className="discover-pill-label">
                  Quiet
                </label>

                <input
                  type="radio"
                  id="noise-buzz"
                  name="noise"
                  value="buzz"
                  className="discover-pill-input"
                  checked={form.noise === "buzz"}
                  onChange={handleChange}
                />
                <label htmlFor="noise-buzz" className="discover-pill-label">
                  Background buzz
                </label>
              </div>
            </div>

            <div className="discover-section discover-grid">
              <div className="discover-field">
                <label className="discover-label" htmlFor="groupSize">
                  Group size
                </label>
                <input
                  id="groupSize"
                  type="number"
                  name="groupSize"
                  min={1}
                  max={8}
                  value={form.groupSize}
                  onChange={handleChange}
                  className="discover-number"
                />
              </div>

              <div className="discover-field">
                <label className="discover-label" htmlFor="duration">
                  Session length (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  name="duration"
                  min={15}
                  max={240}
                  step={15}
                  value={form.duration}
                  onChange={handleChange}
                  className="discover-number"
                />
              </div>
            </div>

            <div className="discover-section">
              <label className="discover-label" htmlFor="q">
                Or describe what you need (optional)
              </label>
              <textarea
                id="q"
                name="q"
                rows={2}
                value={form.q}
                onChange={handleChange}
                placeholder='e.g. "Quiet spot for 3 people to grind problem sets until 5pm"'
                className="discover-textarea"
              />
            </div>

            <div className="discover-actions">
              <button type="submit" className="primary-button">
                Find me a spot
              </button>
              <button
                type="button"
                className="primary-outline-button discover-ai-btn"
                onClick={handleAISuggestions}
                disabled={aiLoading}
              >
                {aiLoading ? "Asking AI..." : "Get AI suggestions"}
              </button>
            </div>
          </form>
        </section>

        <section className="discover-results">
          {aiSuggestions.length > 0 && (
            <div ref={aiResultsRef} className="discover-ai-section discover-ai-section-first">
              <h2 className="discover-results-title">AI recommendations</h2>
              <ul className="discover-result-list">
                {aiSuggestions.map((item, idx) => (
                  <li key={idx} className="discover-result-card ai-card">
                    <div className="discover-result-header">
                      <div className="discover-result-title">
                        <div className="discover-room-name">{item.space}</div>
                        <div className="discover-library-name">{item.library}</div>
                      </div>
                    </div>
                    <p className="discover-reason">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aiError && <p className="discover-ai-error">{aiError}</p>}
          {recommendations.length ? (
            <>
              <h2 className="discover-results-title">Top matches right now</h2>
              <ul className="discover-result-list">
                {recommendations.map((rec) => {
                  const summary = ratingSummaryBySpace.get(rec.space.id) || { avg: null, last: null };
                  const avg = summary.avg;
                  const last = summary.last;
                  const library = libraries.find((l) => l.id === rec.space.libraryId);
                  return (
                    <li key={rec.space.id} className="discover-result-card">
                      <Link to={`/libraries/${rec.space.libraryId}`} className="discover-result-link">
                      <div className="discover-result-header">
                        <div className="discover-result-title">
                          <div className="discover-room-name">{rec.space.name}</div>
                          <div className="discover-library-name">{library?.name}</div>
                        </div>
                        {avg ? (
                          <div className="rating-badge">
                            <span className="rating-label">Avg:</span>
                            <span className="rating-value">{avg}/5</span>
                          </div>
                        ) : (
                          <div className="rating-badge no-rating">
                            <div className="rating-text-group">
                              <span className="rating-label">No recent ratings</span>
                              <span className="rating-hint">
                                Be the first to rate this room from Lock In
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="discover-reason">{rec.reason}</p>
                      {last && (
                        <div className="rating-timestamp">
                          Updated {new Date(last.createdAt).toLocaleTimeString()}
                        </div>
                      )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="discover-empty">
              <p>Tell us how you like to study and we’ll surface spaces that fit your vibe.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

