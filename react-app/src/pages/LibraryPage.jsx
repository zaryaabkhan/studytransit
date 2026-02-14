import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useLibraryWithSpaces } from "../state/AppState.jsx";
import { SpaceCard } from "../components/SpaceCard.jsx";

export function LibraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { library, spaces } = useLibraryWithSpaces(id);

  if (!library) {
    return (
      <main className="library-list">
        <p>Library not found.</p>
        <button className="primary-button" onClick={() => navigate("/")}>
          Back to list
        </button>
      </main>
    );
  }

  return (
    <>
      <header className="detail-header">
        <Link to="/" className="back-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="header-title-section">
          <h1 className="library-title">{library.name.toUpperCase()}</h1>
          {library.location && <div className="library-location-header">{library.location}</div>}
        </div>
      </header>
      <main className="spaces-container">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </main>
    </>
  );
}

