import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Get the current day name (Monday, Tuesday, ...) to match room_data keys.
 */
function getCurrentDayName() {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  }


/**
 * Fetch all library documents from the Libraries collection.
 * @returns {Promise<Array<{ id: string, ...data }>>}
 */
export async function fetchAllLibraries() {
  const libsRef = collection(db, "Libraries");
  const snap = await getDocs(libsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all spaces in a library (subcollection at Libraries/{libraryId}/spaces).
 * Each space has room_data: { space_name, space_capacity, space_counter, Monday, Tuesday, ... }.
 * @param {string} libraryId - e.g. "lib1"
 * @returns {Promise<Array<{ id: string, ...data }>>}
 */
export async function fetchAllSpacesFromLibrary(libraryId) {
  const spacesRef = collection(db, "Libraries", libraryId, "spaces");
  const snap = await getDocs(spacesRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Update space_capacity and/or space_counter for a space (writes to room_data in Firestore).
 * @param {string} libraryId
 * @param {string} spaceId
 * @param {{ space_capacity?: string | number, space_counter?: number }} updates
 */
export async function updateSpaceCapacityAndCounter(
  libraryId,
  spaceId,
  { space_capacity, space_counter }
) {
  const spaceRef = doc(db, "Libraries", libraryId, "spaces", spaceId);
  const updates = {};
  console.log("space_capacity", space_capacity);
  console.log("space_counter", space_counter);
  if (space_capacity !== undefined)
    updates["room_data.space_capacity"] = space_capacity;
  if (space_counter !== undefined)
    updates["room_data.space_counter"] = space_counter;
  if (Object.keys(updates).length === 0) return;
  await updateDoc(spaceRef, updates);
  updateRoomDataForSpace(libraryId, spaceId, space_counter);
}


/**
 * Update room_data for a space for the current day only.
 * Reads current room_data, sets only today's day count (e.g. Monday: 3), and writes back.
 * All other fields (other days, space_capacity, space_counter, space_name) are preserved.
 * @param {string} libraryId
 * @param {string} spaceId
 * @param {number} dayCount - value to set for today's day key (e.g. Monday)
 */
export async function updateRoomDataForSpace(
  libraryId,
  spaceId,
  dayCount
) {
  const spaceRef = doc(db, "Libraries", libraryId, "spaces", spaceId);
  const snap = await getDoc(spaceRef);
  if (!snap.exists()) throw new Error(`Space ${spaceId} not found`);
  const current = snap.data();
  const currentRoomData = current.room_data ?? {};
  const currentDay = getCurrentDayName();
  const merged = { ...currentRoomData, [currentDay]: dayCount };
  await updateDoc(spaceRef, { room_data: merged });
}
