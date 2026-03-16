"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check, Loader2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CitySearch({ city, setCity, uvColor }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced Search — Australian postcodes
  useEffect(() => {
    const q = query.trim();
    
    if (q.length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let auResults = [];

        // OpenWeather API route for Postcodes
        const res = await fetch(`/api/geocode?zip=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          auResults = [{
            id: `postcode-${data.postcode}`,
            name: data.name,
            latitude: data.lat,
            longitude: data.lon,
            admin1: data.state || "",
            postcode: data.postcode
          }];
        }
        
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
      {/* TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }
        }}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
          borderRadius: 20, background: "var(--bg-2, #fff)",
          border: `1.5px solid ${open ? uvColor : "var(--border, rgba(0,0,0,0.08))"}`,
          boxShadow: open ? `0 0 0 4px ${uvColor}25` : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer",
        }}
      >
        <div style={{ color: open ? uvColor : "var(--fg-3, #9ca3af)", transition: "color 0.2s" }}>
          <Search size={18} strokeWidth={3} />
        </div>
        <div style={{ flex: 1, textAlign: "left", fontSize: 16, fontWeight: 700, color: "var(--fg, #111)" }}>
          {displayCity}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} style={{ color: "var(--fg-3, #9ca3af)" }}>
          <ChevronDown size={20} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {/* DROPDOWN PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              position: "absolute", top: "calc(100% + 12px)", left: 0, right: 0, zIndex: 100,
              background: "var(--bg-2, #fff)", borderRadius: 24, border: "1px solid var(--border, rgba(0,0,0,0.08))",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)", overflow: "hidden",
            }}
          >
            {/* TABS HEADER - Simplified to Postcode only */}
            <div style={{ display: "flex", padding: "8px", background: "var(--bg-3, rgba(0,0,0,0.02))", borderBottom: "1px solid var(--border)", gap: 8 }}>
              <div
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px",
                  borderRadius: 16, border: "none", fontSize: 14, fontWeight: 700,
                  background: "var(--bg-2, #fff)",
                  color: "var(--fg, #111)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.2s",
                }}
              >
                <Hash size={16} strokeWidth={2.5} style={{ color: uvColor }} />
                Postcode Search
              </div>
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
              <input
                ref={inputRef}
                type="number"
                placeholder="e.g. 3053..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 16, fontWeight: 600, color: "var(--fg, #111)", width: "100%", letterSpacing: 1 }}
              />
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setQuery("")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28,
                    borderRadius: "50%", background: "var(--bg-3, rgba(0,0,0,0.05))", border: "none",
                    cursor: "pointer", color: "var(--fg-2, #555)",
                  }}
                >
                  <X size={16} strokeWidth={3} />
                </motion.button>
              )}
            </div>

            {/* RESULTS LIST */}
            <div style={{ maxHeight: 280, overflowY: "auto", padding: 8 }}>
              {loading ? (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", color: "var(--fg-3, #9ca3af)", fontSize: 14, fontWeight: 600 }}>
                  <Loader2 size={24} style={{ color: uvColor, animation: "spin 1s linear infinite" }} />
                  <span>Searching Postcodes...</span>
                </div>
              ) : results.length === 0 && query.length > 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3, #9ca3af)", fontSize: 14, fontWeight: 600 }}>
                  No Postcode found for "{query}"
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3, #9ca3af)", fontSize: 14, fontWeight: 600 }}>
                  Type to search for an Australian postcode...
                </div>
              ) : (
                <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {results.map((res) => {
                    const isSelected = typeof city !== "string" && city?.name === res.name;
                    return (
                      <motion.button
                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                        key={`${res.id}`}
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(res); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
                          borderRadius: 16, border: "none", cursor: "pointer", textAlign: "left",
                          background: isSelected ? `${uvColor}12` : "transparent",
                          color: isSelected ? uvColor : "var(--fg, #111)", transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-3, rgba(0,0,0,0.03))"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: isSelected ? uvColor : "var(--border, rgba(0,0,0,0.15))", flexShrink: 0 }} />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.name}</div>
                          <div style={{ fontSize: 12, color: "var(--fg-3, #9ca3af)", marginTop: 2, fontWeight: 500 }}>
                            {res.admin1 ? `${res.admin1}, ` : ""}Australia {res.postcode && `• ${res.postcode}`}
                          </div>
                        </div>
                        {isSelected && <div style={{ display: "flex", color: uvColor, flexShrink: 0 }}><Check size={18} strokeWidth={3} /></div>}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
