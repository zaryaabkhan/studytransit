import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function isFirebaseConfigured() {
  return firebaseConfig.apiKey && firebaseConfig.projectId;
}

let app = null;
let db = null;

export function getFirebaseDb() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

/**
 * Fetch libraries and spaces from Firestore.
 * Collections: libraries (id, name, location), spaces (id, libraryId, name, capacity)
 * Returns { libraries: [], spaces: [] } or null if Firebase not configured or fetch fails.
 */
export async function fetchLibrariesAndSpacesFromFirebase() {
  const firestore = getFirebaseDb();
  if (!firestore) return null;

  try {
    const [libsSnap, spacesSnap] = await Promise.all([
      getDocs(collection(firestore, "libraries")),
      getDocs(collection(firestore, "spaces")),
    ]);

    const libraries = libsSnap.docs.map((doc) => {
      const d = doc.data();
      return { id: doc.id, name: d.name || "", location: d.location || "" };
    });

    const spaces = spacesSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        libraryId: d.libraryId || "",
        name: d.name || "",
        capacity: typeof d.capacity === "number" ? d.capacity : 3,
      };
    });

    if (libraries.length === 0 && spaces.length === 0) return null;
    return { libraries, spaces };
  } catch {
    return null;
  }
}
