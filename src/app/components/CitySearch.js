"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check, Loader2 } from "lucide-react";

export default function CitySearch({
  city,
  setCity,
  uvColor,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Debounced Search — Australian locations only
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Open-Meteo geocoding with AU country filter
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();

        // Client-side filter: only Australian results
        const auResults = (data.results || []).filter(
          (r) => r.country_code === "AU"
        );
        setResults(auResults);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

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

  const handleSelect = (result) => {
    setCity({
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      state: result.admin1 || "AU",
      arpansa: result.name,
    });
    setQuery("");
    setOpen(false);
  };

  const displayCity = typeof city === "string" ? city : city?.name || "Melbourne";

  return (
    <div ref={wrapRef} style={{ flex: 1, position: "relative" }}>
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          borderRadius: 16, background: "var(--bg-2, #fff)",
          border: `1.5px solid ${focused || open ? uvColor : "var(--border, rgba(0,0,0,0.08))"}`,
          boxShadow: focused || open ? `0 0 0 3px ${uvColor}25` : "none",
          transition: "all 0.2s", cursor: "text",
        }}
      >
        <div style={{ display: "flex", color: "var(--fg-3, #9ca3af)", flexShrink: 0 }}>
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={displayCity}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          aria-label="Search Australian suburb or postcode"
          autoComplete="off"
          spellCheck="false"
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 15, fontWeight: 700, color: "var(--fg, #111)", width: "100%",
          }}
        />
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setQuery(""); inputRef.current?.focus(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, borderRadius: "50%", background: "var(--bg-3, rgba(0,0,0,0.05))",
              border: "none", cursor: "pointer", color: "var(--fg-2, #555)", flexShrink: 0,
            }}
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}
        <div style={{ display: "flex", color: focused || open ? uvColor : "var(--fg-3, #9ca3af)", transition: "color 0.2s", flexShrink: 0 }}>
          <ChevronDown size={20} strokeWidth={2.5} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100,
          background: "var(--bg-2, #fff)", borderRadius: 16, border: "1px solid var(--border, rgba(0,0,0,0.08))",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto", padding: 8,
        }}>
          {loading ? (
            <div style={{ padding: "16px", display: "flex", gap: 10, alignItems: "center", justifyContent: "center", color: "var(--fg-3, #9ca3af)", fontSize: 13, fontWeight: 600 }}>
              <Loader2 size={16} style={{ color: uvColor, animation: "spin 1s linear infinite" }} /> Searching Australia…
            </div>
          ) : results.length === 0 && query.length > 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--fg-3, #9ca3af)", fontSize: 13, fontWeight: 600 }}>No Australian locations found</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--fg-3, #9ca3af)", fontSize: 13, fontWeight: 600 }}>Type an Australian suburb or postcode…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {results.map((res) => {
                const isSelected = typeof city !== "string" && city?.name === res.name;
                return (
                  <button
                    key={`${res.id}`}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(res); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px",
                      borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                      background: isSelected ? `${uvColor}12` : "transparent",
                      color: isSelected ? uvColor : "var(--fg, #111)",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-3, rgba(0,0,0,0.03))"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isSelected ? uvColor : "var(--border, rgba(0,0,0,0.15))", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.name}</span>
                    <span style={{ fontSize: 11, color: "var(--fg-3, #9ca3af)", fontFamily: "monospace", flexShrink: 0 }}>
                      {res.admin1 ? `${res.admin1}, ` : ""}AU
                    </span>
                    {isSelected && <div style={{ display: "flex", color: uvColor, flexShrink: 0 }}><Check size={16} strokeWidth={3} /></div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
