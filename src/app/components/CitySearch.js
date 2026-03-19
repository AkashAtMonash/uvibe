// src/app/components/CitySearch.js
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  Check,
  Loader2,
  MapPin,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CITIES } from "@/utils/uv";

// All ARPANSA-monitored cities with live UV data
const ARPANSA_CITIES = Object.entries(CITIES).map(([name, data]) => ({
  id: `arpansa-${name}`,
  name,
  lat: data.lat,
  lon: data.lon,
  state: data.state,
  arpansa: data.arpansa,
  isARPANSA: true,
}));

export default function CitySearch({ city, setCity, uvColor }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [postcodeResults, setPostcodeResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const isNumeric = (s) => /^\d+$/.test(s.trim());

  // Filter ARPANSA cities instantly by name
  const cityResults =
    query.trim().length > 0 && !isNumeric(query)
      ? ARPANSA_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
            c.state.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];

  // Debounced postcode search via /api/geocode
  useEffect(() => {
    const q = query.trim();
    if (!isNumeric(q) || q.length < 3) {
      setPostcodeResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?zip=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setPostcodeResults([
            {
              id: `postcode-${data.postcode}`,
              name: data.name,
              lat: data.lat,
              lon: data.lon,
              state: data.state || "",
              arpansa: data.name,
              postcode: data.postcode,
              isARPANSA: false,
            },
          ]);
        } else {
          setPostcodeResults([]);
        }
      } catch {
        setPostcodeResults([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
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
      lat: result.lat,
      lon: result.lon,
      state: result.state || "AU",
      arpansa: result.arpansa || result.name,
    });
    setQuery("");
    setOpen(false);
  };

  const displayCity =
    typeof city === "string" ? city : city?.name || "Melbourne";
  const allResults = [...cityResults, ...postcodeResults];
  const showEmpty =
    query.trim().length > 0 && allResults.length === 0 && !loading;
  const showDefault = query.trim().length === 0;

  return (
    <div ref={wrapRef} style={{ flex: 1, position: "relative" }}>
      {/* ── Trigger button ── */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setOpen((p) => !p);
          if (!open) setTimeout(() => inputRef.current?.focus(), 80);
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          borderRadius: 20,
          background: "var(--bg-2, #1a1a1a)",
          border: `1.5px solid ${open ? uvColor : "var(--border, rgba(255,255,255,0.08))"}`,
          boxShadow: open ? `0 0 0 4px ${uvColor}25` : "none",
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          cursor: "pointer",
        }}
      >
        <Search
          size={18}
          strokeWidth={3}
          style={{
            color: open ? uvColor : "var(--fg-3)",
            transition: "color 0.2s",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            textAlign: "left",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--fg)",
          }}
        >
          {displayCity}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          style={{ display: "flex", color: "var(--fg-3)" }}
        >
          <ChevronDown size={20} strokeWidth={2.5} />
        </motion.span>
      </motion.button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 0,
              right: 0,
              zIndex: 600,
              background: "var(--bg-2)",
              borderRadius: 20,
              border: "1px solid var(--border-2)",
              boxShadow: "0 24px 56px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {/* Search input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Search
                size={16}
                strokeWidth={2.5}
                style={{ color: uvColor, flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="City name or postcode…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-display)",
                }}
              />
              {loading && (
                <Loader2
                  size={16}
                  style={{
                    color: uvColor,
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}
              {query && !loading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setQuery("")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--bg-3)",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--fg-2)",
                    flexShrink: 0,
                  }}
                >
                  <X size={14} strokeWidth={3} />
                </motion.button>
              )}
            </div>

            {/* Results */}
            <div style={{ maxHeight: 320, overflowY: "auto", padding: 8 }}>
              {/* Default state — show all ARPANSA cities */}
              {showDefault && (
                <>
                  <div
                    style={{
                      padding: "6px 12px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Radio size={10} style={{ color: uvColor }} />
                    ARPANSA Live UV Stations
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.03 },
                      },
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {ARPANSA_CITIES.map((c) => {
                      const isSelected =
                        (typeof city !== "string" ? city?.name : city) ===
                        c.name;
                      return (
                        <ResultRow
                          key={c.id}
                          item={c}
                          isSelected={isSelected}
                          uvColor={uvColor}
                          onSelect={handleSelect}
                          badge={c.state}
                        />
                      );
                    })}
                  </motion.div>
                  <div
                    style={{
                      padding: "10px 12px 4px",
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-3)",
                      letterSpacing: 0.5,
                    }}
                  >
                    Or type a postcode to search any Australian suburb
                  </div>
                </>
              )}

              {/* City name results */}
              {cityResults.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "6px 12px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Radio size={10} style={{ color: uvColor }} />
                    Live UV Stations
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.04 },
                      },
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {cityResults.map((c) => {
                      const isSelected =
                        (typeof city !== "string" ? city?.name : city) ===
                        c.name;
                      return (
                        <ResultRow
                          key={c.id}
                          item={c}
                          isSelected={isSelected}
                          uvColor={uvColor}
                          onSelect={handleSelect}
                          badge={c.state}
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}

              {/* Postcode results */}
              {postcodeResults.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "6px 12px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={10} style={{ color: uvColor }} />
                    Postcode Match
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.04 },
                      },
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {postcodeResults.map((c) => {
                      const isSelected =
                        (typeof city !== "string" ? city?.name : city) ===
                        c.name;
                      return (
                        <ResultRow
                          key={c.id}
                          item={c}
                          isSelected={isSelected}
                          uvColor={uvColor}
                          onSelect={handleSelect}
                          badge={c.postcode}
                          note="Nearest ARPANSA station used for UV"
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}

              {/* Empty state */}
              {showEmpty && (
                <div
                  style={{
                    padding: "28px 16px",
                    textAlign: "center",
                    color: "var(--fg-3)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  No results for "{query}"
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 6,
                      color: "var(--fg-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Try a city name (e.g. Sydney) or postcode (e.g. 3000)
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultRow({ item, isSelected, uvColor, onSelect, badge, note }) {
  return (
    <motion.button
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(item);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: isSelected ? `${uvColor}15` : "transparent",
        color: isSelected ? uvColor : "var(--fg)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "var(--bg-3)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: isSelected ? uvColor : "var(--border-2)",
          boxShadow: isSelected ? `0 0 6px ${uvColor}` : "none",
          transition: "all 0.2s",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        {note && (
          <div
            style={{
              fontSize: 10,
              color: "var(--fg-3)",
              marginTop: 1,
              fontFamily: "var(--font-mono)",
            }}
          >
            {note}
          </div>
        )}
      </div>
      {badge && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            padding: "2px 8px",
            borderRadius: 6,
            background: isSelected ? `${uvColor}20` : "var(--bg-3)",
            color: isSelected ? uvColor : "var(--fg-3)",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
      {isSelected && (
        <div style={{ color: uvColor, flexShrink: 0 }}>
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}
