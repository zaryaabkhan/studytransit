/**
 * Seed Columbia libraries into Firestore.
 *
 * Requires:
 *  - A Firebase project with Firestore enabled
 *  - A service account key JSON (Firebase Console → Project settings → Service accounts → Generate new private key)
 *
 * Run from react-app directory:
 *   npm run seed:firestore -- /path/to/serviceAccountKey.json
 * Or:
 *   node src/firebase/seed_columbia_libraries.js.js /path/to/serviceAccountKey.json
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function roomData(openSeatsByDay) {
  // Ensure all days exist; default 0 if omitted
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const out = {};
  for (const d of days) out[d] = Number(openSeatsByDay?.[d] ?? 0);
  return out;
}

const seedData = [
  {
    id: "lib1",
    library_name: "Butler Library",
    spaces: [
      {
        id: "s1",
        space_name: "Main Reading Room",
        space_capacity: 220,
        space_counter: 31,
        room_data: roomData({
          Sunday: 18,
          Monday: 25,
          Tuesday: 31,
          Wednesday: 29,
          Thursday: 20,
          Friday: 14,
          Saturday: 31,
        }),
      },
      {
        id: "s2",
        space_name: "Reference (1st Floor) Study Area",
        space_capacity: 90,
        space_counter: 12,
        room_data: roomData({
          Sunday: 6,
          Monday: 10,
          Tuesday: 12,
          Wednesday: 11,
          Thursday: 8,
          Friday: 7,
          Saturday: 12,
        }),
      },
      {
        id: "s3",
        space_name: "Group Study Tables (Stacks Level)",
        space_capacity: 60,
        space_counter: 9,
        room_data: roomData({
          Sunday: 5,
          Monday: 8,
          Tuesday: 9,
          Wednesday: 7,
          Thursday: 6,
          Friday: 4,
          Saturday: 9,
        }),
      },
    ],
  },

  {
    id: "lib2",
    library_name: "Milstein Undergraduate Library",
    spaces: [
      {
        id: "s1",
        space_name: "Main Floor Quiet Seating",
        space_capacity: 180,
        space_counter: 22,
        room_data: roomData({
          Sunday: 14,
          Monday: 19,
          Tuesday: 22,
          Wednesday: 18,
          Thursday: 15,
          Friday: 10,
          Saturday: 16,
        }),
      },
      {
        id: "s2",
        space_name: "Group Tables (Collaboration Zone)",
        space_capacity: 80,
        space_counter: 13,
        room_data: roomData({
          Sunday: 8,
          Monday: 11,
          Tuesday: 13,
          Wednesday: 12,
          Thursday: 9,
          Friday: 7,
          Saturday: 10,
        }),
      },
    ],
  },

  {
    id: "lib3",
    library_name: "Avery Architectural & Fine Arts Library",
    spaces: [
      {
        id: "s1",
        space_name: "Reading Room",
        space_capacity: 70,
        space_counter: 17,
        room_data: roomData({
          Sunday: 0,
          Monday: 12,
          Tuesday: 17,
          Wednesday: 14,
          Thursday: 10,
          Friday: 8,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib4",
    library_name: "C.V. Starr East Asian Library",
    spaces: [
      {
        id: "s1",
        space_name: "Starr Reading Room",
        space_capacity: 85,
        space_counter: 21,
        room_data: roomData({
          Sunday: 0,
          Monday: 15,
          Tuesday: 21,
          Wednesday: 19,
          Thursday: 14,
          Friday: 9,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib5",
    library_name: "Lehman Social Sciences Library",
    spaces: [
      {
        id: "s1",
        space_name: "Quiet Study Area",
        space_capacity: 95,
        space_counter: 18,
        room_data: roomData({
          Sunday: 0,
          Monday: 14,
          Tuesday: 18,
          Wednesday: 16,
          Thursday: 12,
          Friday: 9,
          Saturday: 0,
        }),
      },
      {
        id: "s2",
        space_name: "Group Study Tables",
        space_capacity: 40,
        space_counter: 6,
        room_data: roomData({
          Sunday: 0,
          Monday: 5,
          Tuesday: 6,
          Wednesday: 4,
          Thursday: 3,
          Friday: 2,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib6",
    library_name: "Science & Engineering Library",
    spaces: [
      {
        id: "s1",
        space_name: "Collaborative Seating (Main)",
        space_capacity: 120,
        space_counter: 27,
        room_data: roomData({
          Sunday: 10,
          Monday: 20,
          Tuesday: 27,
          Wednesday: 24,
          Thursday: 19,
          Friday: 11,
          Saturday: 12,
        }),
      },
      {
        id: "s2",
        space_name: "Quiet Carrels",
        space_capacity: 50,
        space_counter: 9,
        room_data: roomData({
          Sunday: 6,
          Monday: 8,
          Tuesday: 9,
          Wednesday: 8,
          Thursday: 7,
          Friday: 5,
          Saturday: 6,
        }),
      },
    ],
  },

  {
    id: "lib7",
    library_name: "Mathematics Library",
    spaces: [
      {
        id: "s1",
        space_name: "Math Reading Area",
        space_capacity: 35,
        space_counter: 7,
        room_data: roomData({
          Sunday: 0,
          Monday: 5,
          Tuesday: 7,
          Wednesday: 6,
          Thursday: 4,
          Friday: 3,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib8",
    library_name: "Journalism Library",
    spaces: [
      {
        id: "s1",
        space_name: "Study Tables",
        space_capacity: 45,
        space_counter: 11,
        room_data: roomData({
          Sunday: 0,
          Monday: 8,
          Tuesday: 11,
          Wednesday: 10,
          Thursday: 7,
          Friday: 4,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib9",
    library_name: "Li Lu Law Library",
    spaces: [
      {
        id: "s1",
        space_name: "Quiet Reading Room",
        space_capacity: 140,
        space_counter: 33,
        room_data: roomData({
          Sunday: 12,
          Monday: 26,
          Tuesday: 33,
          Wednesday: 29,
          Thursday: 24,
          Friday: 16,
          Saturday: 18,
        }),
      },
    ],
  },

  {
    id: "lib10",
    library_name: "Business & Economics Library in Uris",
    spaces: [
      {
        id: "s1",
        space_name: "Uris Study Area",
        space_capacity: 80,
        space_counter: 19,
        room_data: roomData({
          Sunday: 0,
          Monday: 14,
          Tuesday: 19,
          Wednesday: 17,
          Thursday: 12,
          Friday: 8,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib11",
    library_name: "Gabe M. Wiener Music & Arts Library",
    spaces: [
      {
        id: "s1",
        space_name: "Listening / Study Desks",
        space_capacity: 55,
        space_counter: 10,
        room_data: roomData({
          Sunday: 0,
          Monday: 7,
          Tuesday: 10,
          Wednesday: 9,
          Thursday: 7,
          Friday: 4,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib12",
    library_name: "Social Work Library",
    spaces: [
      {
        id: "s1",
        space_name: "Reading Room",
        space_capacity: 60,
        space_counter: 15,
        room_data: roomData({
          Sunday: 0,
          Monday: 11,
          Tuesday: 15,
          Wednesday: 13,
          Thursday: 9,
          Friday: 6,
          Saturday: 0,
        }),
      },
    ],
  },

  {
    id: "lib13",
    library_name: "Health Sciences Library",
    spaces: [
      {
        id: "s1",
        space_name: "Quiet Study Seating",
        space_capacity: 160,
        space_counter: 41,
        room_data: roomData({
          Sunday: 18,
          Monday: 33,
          Tuesday: 41,
          Wednesday: 36,
          Thursday: 28,
          Friday: 20,
          Saturday: 22,
        }),
      },
    ],
  },
];

async function main() {
  const serviceAccountPath = process.argv[2];
  assert(serviceAccountPath, "Usage: node seed_columbia_libraries.js /path/to/serviceAccountKey.json");
  const abs = path.resolve(serviceAccountPath);
  assert(fs.existsSync(abs), `Service account file not found: ${abs}`);

  const serviceAccount = require(abs);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  console.log("Seeding libraries into Firestore...");

  // Write to "Libraries" (capital L) and spaces subcollection to match app (firebase_utility.jsx).
  // Each space doc has room_data with space_name, space_capacity, space_counter, and day counts.
  const batch = db.batch();

  for (const lib of seedData) {
    const libRef = db.collection("Libraries").doc(lib.id);
    batch.set(libRef, { library_name: lib.library_name });

    for (const space of lib.spaces) {
      const spaceRef = libRef.collection("spaces").doc(space.id);
      const room_data = {
        ...space.room_data,
        space_name: space.space_name,
        space_capacity: String(space.space_capacity),
        space_counter: space.space_counter,
      };
      batch.set(spaceRef, { room_data });
    }
  }

  await batch.commit();

  console.log("✅ Done. Seeded:");
  console.log(`- libraries (collection): ${seedData.length} docs`);
  console.log(`- spaces (subcollections): ${seedData.reduce((a, l) => a + l.spaces.length, 0)} docs`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
