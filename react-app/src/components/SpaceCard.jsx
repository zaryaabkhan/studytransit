import React, { useMemo } from "react";
import { useAppState } from "../state/AppState.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ratioToPeopleCount(ratio) {
  const value = Number(ratio);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value >= 1 && value < 2) return 1;
  if (value >= 2 && value < 3) return 2;
  if (value >= 3 && value < 4) return 3;
  if (value >= 4) return 3;
  return 0;
}

function peopleEmoji(count) {
  return count > 0 ? "👤".repeat(count) : "0 👤";
}

function buildWeeklyChartData(roomData = {}) {
  const capacity = Number(roomData?.space_capacity) || 0;
  return DAYS.map((d) => {
    const dayCount = Number(roomData?.[d] ?? 0);
    console.log(d, dayCount)
    console.log("This is Day: ", d, capacity)
    const ratio = dayCount / 5;
    return {
      day: d.slice(0, 3),
      ratio,
      peopleCount: ratioToPeopleCount(ratio),
    };
  });
}

export function SpaceCard({ space }) {
  const {
    state: { ratings },
  } = useAppState();

  const { ratio, hasData, roomData } = useMemo(() => {
    const rd = space.room_data || {};
    const cap = Number(rd.space_capacity) || 0;
    const cnt = Number(rd.space_counter) ?? 0;
    const r = cap > 0 && cnt > 0 ? (cap / cnt) : cap > 0 ? Infinity : 0;
    console.log("RATIO", r);
    return {
      ratio: r,
      hasData: cap > 0,
      roomData: rd,
    };
  }, [space.room_data]);
  const weeklyData = useMemo(() => buildWeeklyChartData(roomData), [roomData]);

  const { avg: communityAvg, lastRating } = useMemo(() => {
    const spaceRatings = ratings.filter(
      (r) =>
        r.spaceId === space.id &&
        (r.libraryId == null || r.libraryId === space.libraryId)
    );
    if (!spaceRatings.length) return { avg: null, lastRating: null };
    const sum = spaceRatings.reduce((acc, r) => acc + Number(r.value || 0), 0);
    const average = Math.round((sum / spaceRatings.length) * 100) / 100;
    return { avg: average, lastRating: spaceRatings[spaceRatings.length - 1] };
  }, [ratings, space.id, space.libraryId]);

  // 1–5 people: ratio = capacity/counter (>= 1). Low ratio = full → 5; high ratio or empty → 1
  const fullnessLevel = hasData
  ? Math.min(5, Math.max(1, Math.floor(Number.isFinite(ratio) ? ratio : 5)))
  : 0;


  return (
    <section className="space-section">
      <div className="space-card space-card--db">
        <div className="space-card__header">
          <h3 className="space-card__name">{space.name}</h3>
        </div>

        {hasData ? (
          <div className="space-card__occupancy">
            <span className="space-card__people" aria-label={`${fullnessLevel} out of 5: how full`}>
              Current Capacity:
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`space-card__person ${i <= fullnessLevel ? "space-card__person--on" : ""}`}>
                  👤
                </span>
              ))}
            </span>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, opacity: 0.9 }}>
                  Weekly trend (Mon-Sun)
                </div>
              </div>
              <div
                style={{
                  height: 180,
                  marginTop: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, 3]}
                      ticks={[0, 1, 2, 3]}
                      tickFormatter={(value) => peopleEmoji(Number(value))}
                    />
                    <Tooltip
                      formatter={(value, _name, payload) => {
                        const ratioValue = payload?.payload?.ratio;
                        const ratioLabel =
                          Number.isFinite(ratioValue) ? ` (ratio: ${ratioValue})` : "";
                        return [`${peopleEmoji(Number(value))}${ratioLabel}`, "Occupancy"];
                      }}
                    />
                    <Line type="monotone" dataKey="peopleCount" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-card__no-data">
            <span className="space-card__no-data-text">No occupancy data yet</span>
            <span className="space-card__no-data-hint">Check back soon</span>
          </div>
        )}

        {(communityAvg != null || lastRating) && (
          <div className="space-card__community">
            {communityAvg != null && (
              <span className="space-card__community-avg">Community avg: {communityAvg}/5</span>
            )}
            {lastRating && (
              <span className="space-card__community-time">
                Last rating · {formatTimeAgo(lastRating.createdAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const then = new Date(isoString);
  const now = new Date();
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}
