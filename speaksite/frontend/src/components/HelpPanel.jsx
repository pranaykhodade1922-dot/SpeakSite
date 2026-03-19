import React, { useEffect, useState } from "react";
import { ALL_COMMANDS, COMMAND_CATEGORIES } from "../data/commands";
import "../styles/HelpPanel.css";

export default function HelpPanel({ isOpen, onClose }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filters = [
    { id: "all", label: "All" },
    ...COMMAND_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
    })),
  ];

  const visibleCategories = COMMAND_CATEGORIES.filter(
    (category) => activeFilter === "all" || category.id === activeFilter,
  )
    .map((category) => ({
      ...category,
      commands: category.commands.filter((command) => {
        if (!searchQuery) {
          return true;
        }
        const q = searchQuery.toLowerCase();
        return (
          command.syntax.toLowerCase().includes(q) ||
          command.description.toLowerCase().includes(q) ||
          command.example.toLowerCase().includes(q) ||
          command.aliases.some((alias) => alias.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((category) => category.commands.length > 0);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="hp-backdrop" onClick={onClose}>
      <div className="hp-panel" onClick={(event) => event.stopPropagation()}>
        <div className="hp-header">
          <div className="hp-header-left">
            <div className="hp-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                <text x="7" y="10.5" textAnchor="middle" fontSize="9" fill="currentColor" fontWeight="700">
                  ?
                </text>
              </svg>
            </div>
            <span className="hp-title">Voice Commands</span>
          </div>
          <button className="hp-close" onClick={onClose} type="button">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="hp-search-wrap">
          <svg className="hp-search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="9" y1="9" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            className="hp-search"
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery ? (
            <button className="hp-search-clear" onClick={() => setSearchQuery("")} type="button">
              ✕
            </button>
          ) : null}
        </div>

        <div className="hp-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`hp-filter-pill ${activeFilter === filter.id ? "active" : ""}`}
              onClick={() => setActiveFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="hp-list custom-scrollbar">
          {visibleCategories.length === 0 ? <div className="hp-empty">No commands match "{searchQuery}"</div> : null}

          {visibleCategories.map((category) => (
            <div key={category.id} className="hp-category">
              <div className={`hp-cat-label hp-cat-${category.color}`}>{category.label}</div>

              {category.commands.map((command, index) => (
                <div key={`${category.id}-${command.syntax}-${index}`} className="hp-command-card">
                  <div className="hp-command-top">
                    <code className={`hp-syntax hp-syntax-${category.color}`}>{command.syntax}</code>
                    {command.aliases.length > 0 ? (
                      <div className="hp-aliases">
                        {command.aliases.map((alias, aliasIndex) => (
                          <code key={`${command.syntax}-${aliasIndex}`} className="hp-alias">
                            {alias}
                          </code>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="hp-description">{command.description}</p>
                  <div className="hp-example">
                    <span className="hp-example-label">Say:</span>
                    <span className="hp-example-text">"{command.example}"</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="hp-footer">
          <span className="hp-footer-text">{ALL_COMMANDS.length} commands available</span>
          <span className="hp-footer-hint">Say "help" anytime to open this</span>
        </div>
      </div>
    </div>
  );
}
