import React from "react";
import { NavLink } from "react-router-dom";

export function FooterNav() {
  return (
    <footer className="app-footer">
      <NavLink
        to="/"
        className={({ isActive }) => ["footer-icon", isActive ? "active" : ""].join(" ")}
        aria-label="Home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span className="footer-label">Home</span>
      </NavLink>

      <NavLink
        to="/discover"
        className={({ isActive }) => ["footer-icon", isActive ? "active" : ""].join(" ")}
        aria-label="Discover"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
        </svg>
        <span className="footer-label">Discover</span>
      </NavLink>

      <NavLink
        to="/lock"
        className={({ isActive }) => ["footer-icon", isActive ? "active" : ""].join(" ")}
        aria-label="Lock In"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span className="footer-label">Lock In</span>
      </NavLink>

      <NavLink
        to="/stats"
        className={({ isActive }) => ["footer-icon", isActive ? "active" : ""].join(" ")}
        aria-label="Stats"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19h16"></path>
          <path d="M7 16v-6"></path>
          <path d="M12 16V5"></path>
          <path d="M17 16v-3"></path>
        </svg>
        <span className="footer-label">Stats</span>
      </NavLink>
    </footer>
  );
}

