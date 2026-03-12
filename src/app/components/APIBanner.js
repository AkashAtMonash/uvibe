"use client";

const CFG = {
  fallback: {
    msg: "ARPANSA offline — showing Open-Meteo data",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
  },
  error: {
    msg: "All UV feeds unavailable — showing estimated reading",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
  },
};

export default function APIBanner({ status }) {
  if (!status || status === "ok") return null;
  const c = CFG[status] || CFG.fallback;
  return (
    <div
      className="api-banner"
      role="alert"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
      }}
    >
      <span>⚠</span>
      {c.msg}
    </div>
  );
}
