import React from "react";
import "../styles/HelpPanel.css";

export default function HelpButton({ onClick, isOpen }) {
  return (
    <button
      className={`hp-trigger ${isOpen ? "active" : ""}`}
      onClick={onClick}
      aria-label="Open voice commands help"
      title="Voice Commands"
      type="button"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.4" />
        <text x="9" y="13" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="700">
          ?
        </text>
      </svg>
    </button>
  );
}
