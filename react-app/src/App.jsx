import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider } from "./state/AppState.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LibraryPage } from "./pages/LibraryPage.jsx";
import { LockPage } from "./pages/LockPage.jsx";
import { DiscoverPage } from "./pages/DiscoverPage.jsx";
import { StatsPage } from "./pages/StatsPage.jsx";
import { FooterNav } from "./components/FooterNav.jsx";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      {children}
      <FooterNav />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
        <Route
          path="/libraries/:id"
          element={
            <AppShell>
              <LibraryPage />
            </AppShell>
          }
        />
        <Route
          path="/lock"
          element={
            <AppShell>
              <LockPage />
            </AppShell>
          }
        />
        <Route
          path="/discover"
          element={
            <AppShell>
              <DiscoverPage />
            </AppShell>
          }
        />
        <Route
          path="/stats"
          element={
            <AppShell>
              <StatsPage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppStateProvider>
  );
}

