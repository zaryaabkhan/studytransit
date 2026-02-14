import React, { useMemo } from "react";
import { useAppState } from "../state/AppState.jsx";

function timeAgo(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString);
  const now = new Date();
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} hr${diffH === 1 ? "" : "s"} ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
}

export function SpaceCard({ space }) {
  const {
    state: { ratings },
  } = useAppState();

  const { avg, lastRating } = useMemo(() => {
    const spaceRatings = ratings.filter((r) => r.spaceId === space.id);
    if (!spaceRatings.length) {
      return { avg: null, lastRating: null };
    }
    const sum = spaceRatings.reduce((acc, r) => acc + Number(r.value || 0), 0);
    const average = Math.round((sum / spaceRatings.length) * 100) / 100;
    return { avg: average, lastRating: spaceRatings[spaceRatings.length - 1] };
  }, [ratings, space.id]);

  return (
    <section className="space-section">
      <div className="space-card">
        <div className="space-header">
          <div className="space-name">{space.name}</div>
          {avg ? (
            <div className="rating-badge">
              <span className="rating-label">Avg (all):</span>
              <span className="rating-value">{avg}/5</span>
            </div>
          ) : (
            <div className="rating-badge no-rating">
              <span className="rating-icon">📊</span>
              <div className="rating-text-group">
                <span className="rating-label">No recent ratings</span>
                <span className="rating-hint">Be the first to rate!</span>
              </div>
            </div>
          )}
        </div>

        <div className={`occupancy-indicators ${avg ? "" : "no-occupancy"}`}>
          {avg ? (
            Array.from({ length: Math.round(avg) }).map((_, i) => (
              <span key={i} className="person-icon">
                👤
              </span>
            ))
          ) : (
            <span className="occupancy-placeholder">No occupancy data available</span>
          )}
        </div>

        {lastRating && (
          <div className="rating-timestamp">Updated {timeAgo(lastRating.createdAt)} </div>
        )}
      </div>
    </section>
  );
}

