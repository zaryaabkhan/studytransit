import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";
import { fetchAllSpacesFromLibrary } from "../firebase/firebase_utility.jsx";

const TODAY_KEY = new Date().toLocaleDateString("en-US", { weekday: "long" });

function normalizeSpace(raw, libraryId) {
  const rd = raw.room_data || {};
  return {
    id: raw.id,
    libraryId,
    name: rd.space_name ?? "Space",
    capacity: Number(rd.space_capacity) || 0,
  };
}

export function HomePage() {
  const { state: { libraries, spacesByLibraryId, ratings }, dispatch } = useAppState();
  const [ratingModal, setRatingModal] = useState(null);
  const [modalSpaces, setModalSpaces] = useState([]);
  const [ratingSpaceId, setRatingSpaceId] = useState(null);
  const [ratingValue, setRatingValue] = useState(3);

  useEffect(() => {
    if (!ratingModal) {
      setModalSpaces([]);
      return;
    }
    const cached = spacesByLibraryId?.[ratingModal];
    if (cached?.length) {
      setModalSpaces(cached);
      return;
    }
    let cancelled = false;
    fetchAllSpacesFromLibrary(ratingModal)
      .then((raw) => {
        if (!cancelled) setModalSpaces(raw.map((s) => normalizeSpace(s, ratingModal)));
      })
      .catch((err) => console.error("Failed to fetch spaces for rating modal:", err));
    return () => { cancelled = true; };
  }, [ratingModal, spacesByLibraryId]);

  const libraryStats = useMemo(() => {
    const map = new Map();
    libraries.forEach((lib) => {
      const libSpaces = spacesByLibraryId?.[lib.id] ?? [];
      const libRatings = ratings.filter(
        (r) => (r.libraryId ? r.libraryId === lib.id : true) && libSpaces.some((s) => s.id === r.spaceId)
      );
      const count = libRatings.length;
      const avg = count
        ? Math.round((libRatings.reduce((sum, r) => sum + Number(r.value || 0), 0) / count) * 100) / 100
        : null;
      const occupancy = libSpaces.reduce(
        (acc, space) => {
          const roomData = space.room_data || {};
          const capacity = Number(roomData.space_capacity) || 0;
          const counter = Number(roomData.space_counter) || 0;
          const ratio = capacity > 0 && counter > 0 ? capacity / counter : null;
          const todayCount = Number(roomData[TODAY_KEY]) || 0;
          const nextBestSpace =
            ratio != null && (!acc.bestSpace || ratio > acc.bestSpace.ratio)
              ? { name: space.name, ratio: Math.round(ratio * 100) / 100 }
              : acc.bestSpace;
          return {
            totalCapacity: acc.totalCapacity + capacity,
            totalCounter: acc.totalCounter + counter,
            todayCount: acc.todayCount + todayCount,
            bestSpace: nextBestSpace,
          };
        },
        { totalCapacity: 0, totalCounter: 0, todayCount: 0, bestSpace: null }
      );
      const openSeats = Math.max(0, occupancy.totalCapacity - occupancy.totalCounter);
      const occupancyPct = occupancy.totalCapacity
        ? Math.round((occupancy.totalCounter / occupancy.totalCapacity) * 100)
        : null;
      map.set(lib.id, {
        avg,
        count,
        openSeats,
        occupancyPct,
        todayCount: occupancy.todayCount,
        bestSpace: occupancy.bestSpace,
      });
    });
    return map;
  }, [libraries, spacesByLibraryId, ratings]);

  const homepageInsights = useMemo(() => {
    const statsEntries = libraries
      .map((lib) => ({ library: lib, stats: libraryStats.get(lib.id) }))
      .filter((entry) => entry.stats);
    const mostOpenLibrary = statsEntries
      .filter((entry) => entry.stats.occupancyPct != null)
      .sort((a, b) => a.stats.occupancyPct - b.stats.occupancyPct)[0];
    return {
      mostOpenLibrary,
    };
  }, [libraries, libraryStats]);

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
      payload: {
        spaceId: ratingSpaceId,
        libraryId: ratingModal,
        value: Number(ratingValue),
        timestamp: new Date().toISOString(),
      },
    });
    closeRateModal();
  }

  const modalLibrary = ratingModal ? libraries.find((l) => l.id === ratingModal) : null;
  const bestBet = homepageInsights.mostOpenLibrary;

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">StudyTransit</h1>
          <p className="app-tagline">Find your flow · Campus study spaces</p>
        </div>
      </header>
      <main className="library-list">
        <section className="home-insights">
          <article className="home-insight-card">
            <div className="home-insight-card__head">
              <p className="home-insight-card__label">Best bet now</p>
              <span className="home-insight-badge">Live</span>
            </div>
            <p className="home-insight-card__value">
              {bestBet ? bestBet.library.name : "Not enough data"}
            </p>
            <div className="home-insight-meta">
              <span className="home-insight-chip">
                {bestBet?.stats?.bestSpace ? `Top space: ${bestBet.stats.bestSpace.name}` : "No top space yet"}
              </span>
            </div>
            {bestBet && (
              <Link to={`/libraries/${bestBet.library.id}`} className="home-insight-cta">
                View spaces
              </Link>
            )}
          </article>
        </section>

        <div className="library-list-header">
          <h2 className="library-list-title">Libraries</h2>
        </div>
        {libraries.length === 0 && (
          <p className="library-stat-empty" style={{ padding: 24 }}>Loading libraries…</p>
        )}
        {libraries.map((library) => {
          const stats = libraryStats.get(library.id) || { avg: null, count: 0 };
          return (
            <div key={library.id} className="library-card-wrapper">
              <Link to={`/libraries/${library.id}`} className="library-card">
                <div className="library-card-main">
                  <div className="library-name">{library.name}</div>
                  {library.location && <div className="library-location">{library.location}</div>}
                  <div className="library-stats-row">
                  </div>
                  <div className="library-stats-row library-stats-row--secondary">
                    <span className="library-stat">
                      {stats.bestSpace ? `Best now: ${stats.bestSpace.name}` : "Best space pending"}
                    </span>
                  </div>
                  <div className="library-stats-row library-stats-row--secondary">
                    <button
                      type="button"
                      className="library-rate-btn"
                      onClick={(e) => openRateModal(library.id, e)}
                    >
                      Rate now
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
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
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
