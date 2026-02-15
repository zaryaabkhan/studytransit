import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { fetchAllLibraries, fetchAllSpacesFromLibrary } from "../firebase/firebase_utility.jsx";

const STORAGE_KEY_RATINGS = "lionstudy_ratings";
const STORAGE_KEY_SESSIONS = "lionstudy_focus_sessions";
const STORAGE_KEY_GOALS = "lionstudy_goals";
const STORAGE_KEY_EXAMS = "lionstudy_exams";

const AppStateContext = createContext(null);

/** Normalize Firebase space (id + room_data) to app shape (id, libraryId, name, capacity). */
function normalizeSpace(raw, libraryId) {
  const rd = raw.room_data || {};
  return {
    id: raw.id,
    libraryId,
    name: rd.space_name ?? "Space",
    capacity: Number(rd.space_capacity) || 0,
    room_data: rd,
  };
}

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
  libraries: [],
  spacesByLibraryId: {},
  ratings: [],
  focusSessions: [],
  weeklyGoalMinutes: 300,
  exams: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LIBRARIES": {
      const libs = (action.payload || []).map((l) => ({
        id: l.id,
        name: l.library_name ?? l.name ?? "",
        location: l.location ?? "",
      }));
      return { ...state, libraries: libs };
    }
    case "SET_SPACES_FOR_LIBRARY": {
      const { libraryId, spaces } = action.payload || {};
      if (!libraryId) return state;
      return {
        ...state,
        spacesByLibraryId: { ...state.spacesByLibraryId, [libraryId]: spaces || [] },
      };
    }
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
      const { spaceId, libraryId, value, timestamp } = action.payload;
      const rating = {
        id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        spaceId,
        ...(libraryId != null && { libraryId }),
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
    let cancelled = false;
    fetchAllLibraries()
      .then((libs) => {
        if (!cancelled) dispatch({ type: "SET_LIBRARIES", payload: libs });
      })
      .catch((err) => console.error("Failed to fetch libraries:", err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!state.libraries.length) return;
    const byId = state.spacesByLibraryId || {};
    state.libraries.forEach((lib) => {
      if (byId[lib.id]) return;
      fetchAllSpacesFromLibrary(lib.id)
        .then((rawSpaces) => {
          const spaces = rawSpaces.map((s) => normalizeSpace(s, lib.id));
          dispatch({ type: "SET_SPACES_FOR_LIBRARY", payload: { libraryId: lib.id, spaces } });
        })
        .catch((err) => console.error(`Failed to fetch spaces for ${lib.id}:`, err));
    });
  }, [state.libraries]);

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

  const allSpaces = useMemo(
    () => Object.values(state.spacesByLibraryId || {}).flat(),
    [state.spacesByLibraryId]
  );

  const value = useMemo(
    () => ({
      state: { ...state, allSpaces },
      dispatch,
    }),
    [state, allSpaces]
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
  const { state, dispatch } = useAppState();
  const { libraries, spacesByLibraryId } = state;
  const library = libraries.find((l) => l.id === libraryId);
  const spaces = spacesByLibraryId?.[libraryId] ?? [];

  useEffect(() => {
    if (!libraryId || !library || spacesByLibraryId?.[libraryId] !== undefined) return;
    let cancelled = false;
    fetchAllSpacesFromLibrary(libraryId)
      .then((rawSpaces) => {
        if (!cancelled)
          dispatch({ type: "SET_SPACES_FOR_LIBRARY", payload: { libraryId, spaces: rawSpaces.map((s) => normalizeSpace(s, libraryId)) } });
      })
      .catch((err) => console.error(`Failed to fetch spaces for ${libraryId}:`, err));
    return () => { cancelled = true; };
  }, [libraryId, library, spacesByLibraryId]);

  return { library, spaces };
}
