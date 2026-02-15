import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";
import { getAISpaceRecommendations } from "../services/aiClient.js";

export function DiscoverPage() {
  const [form, setForm] = useState({
    intensity: "steady",
    noise: "busy",
    groupSize: 1,
    duration: 60,
    q: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    state: { allSpaces = [], libraries },
  } = useAppState();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const resultsRef = React.useRef(null);

  async function handleFindSpot(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const prefs = {
        intensity: form.intensity,
        noise: form.noise,
        groupSize: Number(form.groupSize) || 1,
        duration: Number(form.duration) || 60,
        query: form.q.trim(),
      };
      const aiResults = await getAISpaceRecommendations(prefs, allSpaces, libraries);
      setResults(Array.isArray(aiResults) ? aiResults : []);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.message || "Could not find spots.");
    } finally {
      setLoading(false);
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
          <form className="discover-form" onSubmit={handleFindSpot}>
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
                  id="noise-busy"
                  name="noise"
                  value="busy"
                  className="discover-pill-input"
                  checked={form.noise === "busy"}
                  onChange={handleChange}
                />
                <label htmlFor="noise-busy" className="discover-pill-label">
                  Busy
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
              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? "Finding your spot…" : "Find me a spot"}
              </button>
            </div>
          </form>
        </section>

        <section className="discover-results">
          {results.length > 0 ? (
            <div ref={resultsRef} className="discover-ai-section discover-ai-section-first">
              <h2 className="discover-results-title">Your spots</h2>
              <ul className="discover-result-list">
                {results.map((item, idx) => {
                  const lib = libraries.find((l) => l.name === item.library);
                  return (
                    <li key={idx} className="discover-result-card ai-card">
                      <Link to={lib ? `/libraries/${lib.id}` : "#"} className="discover-result-link">
                        <div className="discover-result-header">
                          <div className="discover-result-title">
                            <div className="discover-room-name">{item.space}</div>
                            <div className="discover-library-name">{item.library}</div>
                          </div>
                        </div>
                        <p className="discover-reason">{item.reason}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {error && <p className="discover-ai-error">{error}</p>}
          {loading && (
            <div className="discover-empty">
              <p>Finding your spot…</p>
            </div>
          )}
          {results.length === 0 && !loading && (
            <div className="discover-empty">
              <p>Set your preferences and click "Find me a spot" for personalized recommendations.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

