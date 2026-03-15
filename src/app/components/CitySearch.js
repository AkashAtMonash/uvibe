"use client";

import { useState, useRef, useEffect } from "react";
import { CITIES } from "@/utils/uv";

export default function CitySearch({ city, setCity }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const cityNames = Object.keys(CITIES);
  const filtered = query.trim()
    ? cityNames.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : cityNames;

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const select = (name) => {
    setCity(name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="city-search-container" style={{ flex: 1 }}>
      <div
        className={`city-search-field ${focused ? "focused" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <span className="city-search-icon">◎</span>
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
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          aria-label="Search city"
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            className="city-search-clear"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
        <span className="city-search-caret">▾</span>
      </div>

      {open && (
        <div className="city-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <div className="city-empty">No cities found</div>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                role="option"
                aria-selected={name === city}
                className={`city-option ${name === city ? "selected" : ""}`}
                onMouseDown={() => select(name)}
              >
                <div
                  className="city-option-dot"
                  style={{
                    background: name === city ? "var(--uv)" : "var(--fg-3)",
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
