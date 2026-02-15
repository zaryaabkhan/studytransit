import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";

export function HomePage() {
  const { state: { libraries, spaces, ratings }, dispatch } = useAppState();
  const [ratingModal, setRatingModal] = useState(null); // { libraryId } when open
  const [ratingSpaceId, setRatingSpaceId] = useState(null);
  const [ratingValue, setRatingValue] = useState(3);

  const libraryStats = useMemo(() => {
    const map = new Map();
    libraries.forEach((lib) => {
      const libSpaces = spaces.filter((s) => s.libraryId === lib.id);
      const libRatings = ratings.filter((r) => libSpaces.some((s) => s.id === r.spaceId));
      const count = libRatings.length;
      const avg = count
        ? Math.round((libRatings.reduce((sum, r) => sum + Number(r.value || 0), 0) / count) * 100) / 100
        : null;
      map.set(lib.id, { avg, count });
    });
    return map;
  }, [libraries, spaces, ratings]);

  function openRateModal(libraryId, e) {
    e.preventDefault();
    e.stopPropagation();
    setRatingModal(libraryId);
    setRatingSpaceId(null);
    setRatingValue(3);
  }

  function closeRateModal() {
    setRatingModal(null);
    setRatingSpaceId(null);
  }

  function submitLibraryRating(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!ratingSpaceId || !ratingModal) return;
    dispatch({
      type: "ADD_RATING",
      payload: { spaceId: ratingSpaceId, value: Number(ratingValue), timestamp: new Date().toISOString() },
    });
    closeRateModal();
  }

  const modalLibrary = ratingModal ? libraries.find((l) => l.id === ratingModal) : null;
  const modalSpaces = modalLibrary ? spaces.filter((s) => s.libraryId === ratingModal) : [];

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">StudyTransit</h1>
          <p className="app-tagline">Skip the hunt. Find your spot and start studying.</p>
        </div>
      </header>
      <main className="library-list">
        <div className="library-list-header">
          <h2 className="library-list-title">Libraries</h2>
        </div>
        {libraries.map((library) => {
          const stats = libraryStats.get(library.id) || { avg: null, count: 0 };
          return (
            <div key={library.id} className="library-card-wrapper">
              <Link to={`/libraries/${library.id}`} className="library-card">
                <div className="library-card-main">
                  <div className="library-name">{library.name}</div>
                  {library.location && <div className="library-location">{library.location}</div>}
                  <div className="library-stats-row">
                    <span className="library-stat">
                      {stats.count > 0 ? (
                        <>Avg {stats.avg}/5 · {stats.count} rating{stats.count === 1 ? "" : "s"}</>
                      ) : (
                        <span className="library-stat-empty">No ratings yet</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="library-rate-btn"
                      onClick={(e) => openRateModal(library.id, e)}
                      aria-label="Rate this library"
                    >
                      Rate
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </main>

      {ratingModal && (
        <div className="library-rate-modal">
          <div className="library-rate-backdrop" onClick={closeRateModal} />
          <div className="library-rate-dialog">
            <h2 className="library-rate-title">Rate a space at {modalLibrary?.name}</h2>
            <form onSubmit={submitLibraryRating} className="library-rate-form">
              <label className="library-rate-label">Which space are you in?</label>
              <select
                className="library-rate-select"
                value={ratingSpaceId || ""}
                onChange={(e) => setRatingSpaceId(e.target.value || null)}
                required
              >
                <option value="">Select a space</option>
                {modalSpaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <label className="library-rate-label">How full is it? {ratingValue}/5</label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={ratingValue}
                onChange={(e) => setRatingValue(Number(e.target.value))}
                className="library-rate-slider"
              />
              <div className="library-rate-actions">
                <button type="submit" className="primary-button">Submit rating</button>
                <button type="button" className="muted-button" onClick={closeRateModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

