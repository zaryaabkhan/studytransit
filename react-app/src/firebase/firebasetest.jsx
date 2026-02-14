import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // adjust path

export default function FirestoreTest() {
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const spacesRef = collection(db, "Libraries", "lib1", "spaces");
        const snap = await getDocs(spacesRef);

        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log("✅ Connected. Spaces:", data);
        setSpaces(data);
      } catch (e) {
        console.error("❌ Firestore error:", e);
        setError(e?.message || String(e));
      }
    })();
  }, []);

  if (error) return <pre>❌ {error}</pre>;

  return (
    <div>
      <h3>Spaces found: {spaces.length}</h3>
      <pre>{JSON.stringify(spaces, null, 2)}</pre>
    </div>
  );
}
