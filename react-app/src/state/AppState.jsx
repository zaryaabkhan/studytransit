import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

// All Columbia University libraries and study spaces (from library.columbia.edu)
const initialLibraries = [
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

const initialSpaces = [
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

const STORAGE_KEY_RATINGS = "lionstudy_ratings";
const STORAGE_KEY_SESSIONS = "lionstudy_focus_sessions";
const STORAGE_KEY_GOALS = "lionstudy_goals";
const STORAGE_KEY_EXAMS = "lionstudy_exams";

const AppStateContext = createContext(null);

function loadFromStorage(key, fallback, altKey) {
  try {
    let raw = window.localStorage.getItem(key);
    if (!raw && altKey) raw = window.localStorage.getItem(altKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const initialState = {
  libraries: initialLibraries,
  spaces: initialSpaces,
  ratings: [],
  focusSessions: [],
  weeklyGoalMinutes: 300,
  exams: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT_FROM_STORAGE": {
      return {
        ...state,
        ratings: action.payload.ratings,
        focusSessions: action.payload.focusSessions,
        weeklyGoalMinutes: action.payload.weeklyGoalMinutes ?? 300,
        exams: action.payload.exams ?? [],
      };
    }
    case "ADD_EXAM": {
      const exam = { id: `exam-${Date.now()}`, ...action.payload };
      return { ...state, exams: [...state.exams, exam].sort((a, b) => new Date(a.date) - new Date(b.date)) };
    }
    case "REMOVE_EXAM": {
      return { ...state, exams: state.exams.filter((e) => e.id !== action.payload) };
    }
    case "ADD_RATING": {
      const { spaceId, value, timestamp } = action.payload;
      const rating = {
        id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        spaceId,
        value,
        createdAt: timestamp || new Date().toISOString(),
      };
      return {
        ...state,
        ratings: [...state.ratings, rating],
      };
    }
    case "LOG_SESSION": {
      return {
        ...state,
        focusSessions: [...state.focusSessions, action.payload].slice(-200),
      };
    }
    case "SET_WEEKLY_GOAL": {
      return { ...state, weeklyGoalMinutes: action.payload };
    }
    case "SEED_DEMO_DATA": {
      const now = new Date();
      const demoRatings = [
        { id: "demo-r1", spaceId: "s3", value: 2, createdAt: new Date(now.getTime() - 3600000).toISOString() },
        { id: "demo-r2", spaceId: "s12", value: 3, createdAt: new Date(now.getTime() - 7200000).toISOString() },
        { id: "demo-r3", spaceId: "s18", value: 2, createdAt: new Date(now.getTime() - 10800000).toISOString() },
        { id: "demo-r4", spaceId: "s9", value: 4, createdAt: new Date(now.getTime() - 14400000).toISOString() },
      ];
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 5);
      const demoSessions = [
        { id: "demo-s1", started_at: weekAgo.toISOString(), duration_minutes: 45, task: "exam", energy: "ok", completed: true, finished_at: new Date(weekAgo.getTime() + 45 * 60000).toISOString() },
        { id: "demo-s2", started_at: new Date(weekAgo.getTime() + 86400000).toISOString(), duration_minutes: 60, task: "reading", energy: "energized", completed: true, finished_at: new Date(weekAgo.getTime() + 86400000 + 60 * 60000).toISOString() },
        { id: "demo-s3", started_at: new Date(weekAgo.getTime() + 172800000).toISOString(), duration_minutes: 30, task: "writing", energy: "tired", completed: true, finished_at: new Date(weekAgo.getTime() + 172800000 + 30 * 60000).toISOString() },
      ];
      return {
        ...state,
        ratings: [...state.ratings, ...demoRatings],
        focusSessions: [...state.focusSessions, ...demoSessions].slice(-200),
      };
    }
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const ratings = loadFromStorage(STORAGE_KEY_RATINGS, [], "studytransit_ratings");
    const sessions = loadFromStorage(STORAGE_KEY_SESSIONS, [], "studytransit_focus_sessions");
    const goals = window.localStorage.getItem(STORAGE_KEY_GOALS);
    const weeklyGoal = goals ? parseInt(goals, 10) : 300;
    const examsRaw = window.localStorage.getItem(STORAGE_KEY_EXAMS);
    let exams = [];
    try {
      if (examsRaw) exams = JSON.parse(examsRaw);
      if (!Array.isArray(exams)) exams = [];
    } catch {
      exams = [];
    }
    dispatch({ type: "INIT_FROM_STORAGE", payload: { ratings, focusSessions: sessions, weeklyGoalMinutes: weeklyGoal, exams } });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_RATINGS, JSON.stringify(state.ratings));
    } catch {
      // ignore
    }
  }, [state.ratings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(state.focusSessions));
    } catch {
      // ignore
    }
  }, [state.focusSessions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_GOALS, String(state.weeklyGoalMinutes));
    } catch {
      // ignore
    }
  }, [state.weeklyGoalMinutes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(state.exams));
    } catch {
      // ignore
    }
  }, [state.exams]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}

export function useLibraryWithSpaces(libraryId) {
  const {
    state: { libraries, spaces },
  } = useAppState();
  const library = libraries.find((l) => l.id === libraryId);
  const librarySpaces = spaces.filter((s) => s.libraryId === libraryId);
  return { library, spaces: librarySpaces };
}
