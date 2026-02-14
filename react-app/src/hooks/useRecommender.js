import { useMemo } from "react";
import { useAppState } from "../state/AppState.jsx";

export function useSpaceRecommendations(preferences) {
  const {
    state: { spaces, libraries, ratings },
  } = useAppState();

  const normPrefs = useMemo(() => normalizePreferences(preferences), [preferences]);

  return useMemo(() => {
    if (!normPrefs) return [];

    const avgBySpace = new Map();
    ratings.forEach((r) => {
      const entry = avgBySpace.get(r.spaceId) || { sum: 0, count: 0 };
      entry.sum += Number(r.value || 0);
      entry.count += 1;
      avgBySpace.set(r.spaceId, entry);
    });

    return spaces
      .map((space) => {
        const entry = avgBySpace.get(space.id);
        if (!entry || !entry.count) return null;
        const avg = Math.round((entry.sum / entry.count) * 100) / 100;
        const score = computeScore(space, avg, normPrefs);
        const reason = buildReason(space, avg, normPrefs, libraries);
        return { space, score, reason };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [spaces, libraries, ratings, normPrefs]);
}

function normalizePreferences(prefs) {
  if (!prefs) return null;
  const { noise, intensity, groupSize, duration, query } = prefs;
  const parsed = {
    noise: noise || null,
    intensity: intensity || null,
    groupSize: groupSize ? Number(groupSize) : null,
    durationMinutes: duration ? Number(duration) : null,
  };

  const q = (query || "").toLowerCase();
  if (q) {
    if (!parsed.noise) {
      if (q.match(/silent|very quiet|silent floor/)) parsed.noise = "silent";
      else if (q.match(/quiet|focus|concentrate/)) parsed.noise = "quiet";
      else if (q.match(/chatty|group|collab|social|buzz/)) parsed.noise = "buzz";
    }

    if (!parsed.intensity) {
      if (q.match(/exam|midterm|final|deep work|grind/)) parsed.intensity = "deep";
      else if (q.match(/review|reading|steady/)) parsed.intensity = "steady";
      else if (q.match(/friends|group|project|collab|social/)) parsed.intensity = "social";
    }

    if (!parsed.groupSize) {
      const m = q.match(/for (\d+)/) || q.match(/group of (\d+)/);
      if (m) parsed.groupSize = Number(m[1]);
    }
  }

  if (!parsed.noise && !parsed.intensity && !parsed.groupSize && !parsed.durationMinutes) {
    return null;
  }

  const group = parsed.groupSize || 1;
  parsed.groupSize = Math.min(Math.max(group, 1), 6);
  parsed.durationMinutes = parsed.durationMinutes || 60;
  return parsed;
}

function computeScore(space, avg, prefs) {
  const { noise, intensity, groupSize, durationMinutes } = prefs;

  let ideal;
  switch (intensity) {
    case "deep":
      ideal = 2;
      break;
    case "social":
      ideal = 4;
      break;
    case "steady":
    default:
      ideal = 3;
      break;
  }

  const occupancyPenalty = Math.abs(avg - ideal);

  let noiseBonus = 0;
  if (noise === "silent") noiseBonus = (5 - avg) * 0.6;
  else if (noise === "quiet") noiseBonus = (5 - avg) * 0.4;
  else if (noise === "buzz") noiseBonus = (avg - 2.5) * 0.2;

  const durationFactor = durationMinutes / 60;
  const durationBonus = (5 - avg) * 0.2 * durationFactor;

  let capacityBonus = 0;
  if (space.capacity && groupSize >= 3) {
    capacityBonus = Math.max(space.capacity - avg, 0) * 0.3;
  }

  const baseScore = 10 - occupancyPenalty * 2;
  return baseScore + noiseBonus + durationBonus + capacityBonus;
}

function buildReason(space, avg, prefs, libraries) {
  const { intensity, noise, groupSize, durationMinutes } = prefs;
  const library = libraries.find((l) => l.id === space.libraryId);

  let intensityPhrase = "steady, focused studying";
  if (intensity === "deep") intensityPhrase = "deep focus work";
  else if (intensity === "social") intensityPhrase = "collaborative or group work";

  let occupancyPhrase;
  if (avg <= 2) occupancyPhrase = "usually pretty open right now";
  else if (avg <= 3.5) occupancyPhrase = "moderately busy with room to concentrate";
  else occupancyPhrase = "on the fuller side but with good energy";

  let noisePhrase = "balanced for most study styles";
  if (noise === "silent") noisePhrase = "suited to very quiet sessions";
  else if (noise === "quiet") noisePhrase = "good for a quiet atmosphere";
  else if (noise === "buzz") noisePhrase = "better if you don't mind some background buzz";

  let durationPhrase = "solid work block";
  if (durationMinutes <= 45) durationPhrase = "short, focused sprint";
  else if (durationMinutes > 90) durationPhrase = "longer session";

  let groupPhrase = "solo studying";
  if (groupSize >= 2 && groupSize <= 3) groupPhrase = "small group work";
  else if (groupSize > 3) groupPhrase = "larger groups";

  return `${library?.name ?? "Library"} – ${space.name} is ${occupancyPhrase} (avg ${avg}/5), ${noisePhrase}, and works well for ${intensityPhrase} as a ${durationPhrase} for ${groupPhrase}.`;
}

