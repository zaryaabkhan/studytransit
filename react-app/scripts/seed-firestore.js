/**
 * Seed Firestore with Columbia libraries and spaces.
 * Run with: node scripts/seed-firestore.js
 * Requires Firebase Admin SDK or use the Firebase console to import.
 *
 * Collections:
 * - libraries: { id, name, location }
 * - spaces: { id, libraryId, name, capacity }
 */

const libraries = [
  { id: "lib-1", name: "Butler Library", location: "535 W 114th St" },
  { id: "lib-2", name: "Avery Architectural & Fine Arts", location: "Avery Hall" },
  { id: "lib-3", name: "Business & Economics (Uris)", location: "Uris Hall" },
  { id: "lib-4", name: "Lehman Social Sciences", location: "International Affairs" },
  { id: "lib-5", name: "Science & Engineering", location: "Northwest Corner Building" },
  { id: "lib-6", name: "Starr East Asian Library", location: "Kent Hall" },
  { id: "lib-7", name: "Music & Arts Library", location: "Dodge Hall" },
  { id: "lib-8", name: "Burke Library", location: "3041 Broadway (UTS)" },
  { id: "lib-9", name: "Social Work Library", location: "School of Social Work" },
  { id: "lib-10", name: "Barnard Milstein Center", location: "Barnard College" },
];

const spaces = [
  { id: "s1", libraryId: "lib-1", name: "Main Reading Room", capacity: 4 },
  { id: "s2", libraryId: "lib-1", name: "Floors 2–4 (24/7)", capacity: 4 },
  { id: "s3", libraryId: "lib-1", name: "Room 301 (Quiet)", capacity: 2 },
  { id: "s4", libraryId: "lib-1", name: "Rooms 502–504", capacity: 2 },
  { id: "s5", libraryId: "lib-1", name: "Rooms 601–607", capacity: 2 },
  { id: "s6", libraryId: "lib-1", name: "Stacks", capacity: 3 },
  { id: "s7", libraryId: "lib-1", name: "Rooms 202, 209 (Group)", capacity: 4 },
  { id: "s8", libraryId: "lib-1", name: "Rooms 403A–409A (Group)", capacity: 5 },
  { id: "s9", libraryId: "lib-2", name: "Main Reading Room", capacity: 3 },
  { id: "s10", libraryId: "lib-2", name: "Quiet Study Area", capacity: 2 },
  { id: "s11", libraryId: "lib-3", name: "Floors 1–2 (Group)", capacity: 4 },
  { id: "s12", libraryId: "lib-3", name: "3rd Floor (Quiet)", capacity: 3 },
  { id: "s13", libraryId: "lib-3", name: "Study Rooms", capacity: 5 },
  { id: "s14", libraryId: "lib-4", name: "Room 329A", capacity: 3 },
  { id: "s15", libraryId: "lib-4", name: "Main Floor", capacity: 4 },
  { id: "s16", libraryId: "lib-4", name: "Group Study", capacity: 5 },
  { id: "s17", libraryId: "lib-5", name: "400 Level", capacity: 4 },
  { id: "s18", libraryId: "lib-5", name: "Quiet Study", capacity: 3 },
  { id: "s19", libraryId: "lib-5", name: "Lab Space", capacity: 4 },
  { id: "s20", libraryId: "lib-6", name: "Main Reading Room", capacity: 3 },
  { id: "s21", libraryId: "lib-6", name: "Quiet Study", capacity: 2 },
  { id: "s22", libraryId: "lib-7", name: "Main Floor", capacity: 3 },
  { id: "s23", libraryId: "lib-7", name: "Listening Room", capacity: 2 },
  { id: "s24", libraryId: "lib-8", name: "Main Reading Room", capacity: 3 },
  { id: "s25", libraryId: "lib-8", name: "Quiet Study", capacity: 2 },
  { id: "s26", libraryId: "lib-9", name: "Main Floor", capacity: 4 },
  { id: "s27", libraryId: "lib-9", name: "Group Study", capacity: 5 },
  { id: "s28", libraryId: "lib-10", name: "Upper Floors", capacity: 4 },
  { id: "s29", libraryId: "lib-10", name: "Group Study", capacity: 5 },
];

console.log("Firestore seed data (paste into Firebase Console or use Admin SDK):\n");
console.log("Collection: libraries");
console.log(JSON.stringify(libraries, null, 2));
console.log("\nCollection: spaces");
console.log(JSON.stringify(spaces, null, 2));
