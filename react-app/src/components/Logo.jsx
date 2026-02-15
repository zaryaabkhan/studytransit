import React from "react";

export function Logo({ size = 40, className = "" }) {
  return (
    <span className={className} role="img" aria-label="Book" style={{ fontSize: size, lineHeight: 1 }}>
      📖
    </span>
  );
}
