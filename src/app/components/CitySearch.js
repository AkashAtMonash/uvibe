"use client";
// src/components/CitySearch.js

import { useState, useRef, useEffect } from "react";
import { CITIES } from "@/utils/uv";

export default function CitySearch({
  city,
  setCity,
  uvColor,
  geoGranted,
  onRequestGeo,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const cityNames = Object.keys(CITIES);
  const filtered =
    query.trim().length === 0
      ? cityNames
      : cityNames.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name) => {
    setCity(name);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setFocused(true);
    setOpen(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1 }}>
      <div
        className="city-search-wrap"
        style={{
          border: `1.5px solid ${focused ? uvColor + "80" : "var(--surface-border-strong)"}`,
          boxShadow: focused ? `0 0 0 3px ${uvColor}18` : "none",
        }}
      >
        <span className="city-search-icon">🔍</span>
        <input
          ref={inputRef}
          className="city-search-input"
          type="text"
          placeholder={city}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Search city"
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            className="city-search-clear"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <span
          className="city-search-caret"
          style={{ color: focused ? uvColor : "var(--text-3)" }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div className="city-dropdown" role="listbox" aria-label="City options">
          {filtered.length === 0 ? (
            <div className="city-dropdown-empty">No cities found</div>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                role="option"
                aria-selected={name === city}
                className={`city-option ${name === city ? "selected" : ""}`}
                style={
                  name === city
                    ? { background: uvColor + "18", color: uvColor }
                    : {}
                }
                onMouseDown={() => handleSelect(name)}
              >
                <span
                  className="city-option-dot"
                  style={{
                    background: name === city ? uvColor : "var(--text-3)",
                  }}
                />
                <span>{name}</span>
                <span className="city-option-state">{CITIES[name].state}</span>
                {name === city && <span className="city-option-check">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
