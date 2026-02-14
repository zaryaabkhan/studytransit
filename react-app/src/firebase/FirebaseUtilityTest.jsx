import { useState } from "react";
import {
  fetchAllLibraries,
  fetchAllSpacesFromLibrary,
  updateSpaceCapacityAndCounter,
  updateRoomDataForSpace,
} from "./firebase_utility.jsx";

export default function FirebaseUtilityTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (fn, label) => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await fn();
      setResult({ label, data });
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
      <h2>Firebase utility tests</h2>
      <p style={{ color: "#666" }}>
        Use your real library/space IDs (e.g. lib1, s1). Updates write to Firestore.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button
          disabled={loading}
          onClick={() => run(fetchAllLibraries, "fetchAllLibraries()")}
        >
          Fetch all libraries
        </button>
        <button
          disabled={loading}
          onClick={() =>
            run(
              () => fetchAllSpacesFromLibrary("lib1"),
              "fetchAllSpacesFromLibrary('lib1')"
            )
          }
        >
          Fetch spaces (lib1)
        </button>
        <button
          disabled={loading}
          onClick={() =>
            run(
              async () => {
                const spaces = await fetchAllSpacesFromLibrary("lib1");
                const s1 = spaces.find((s) => s.id === "s1");
                if (!s1?.room_data?.space_capacity || !s1?.room_data?.space_counter)
                  throw new Error("Space s1 or room_data.space_capacity or room_data.space_counter not found");
                const currentCap = Number(s1.room_data.space_capacity) || 0;
                const currentCount = Number(s1.room_data.space_counter) || 0;
                await updateSpaceCapacityAndCounter("lib1", "s1", {
                  space_capacity:currentCap + 1,
                  space_counter: currentCount + 1,
                });
                return {
                  previous: { space_capacity: currentCap, space_counter: currentCount },
                  updated: { space_capacity: currentCap + 1, space_counter: currentCount + 1 },
                };
              },
              "updateSpaceCapacityAndCounter('lib1','s1', current + 1)"
            )
          }
        >
          Update s1 capacity & counter (+1)
        </button>
        <button
          disabled={loading}
          onClick={() =>
            run(
              () => updateRoomDataForSpace("lib1", "s1", 1),
              "updateRoomDataForSpace('lib1','s1', 1) — set today's day count to 1"
            )
          }
        >
          Update today's day count (1)
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && (
        <pre style={{ background: "#fee", padding: 12, borderRadius: 6 }}>
          {error}
        </pre>
      )}
      {result && (
        <pre
          style={{
            background: "#f0f0f0",
            padding: 12,
            borderRadius: 6,
            overflow: "auto",
            maxHeight: 400,
          }}
        >
          <strong>{result.label}</strong>
          {"\n"}
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
