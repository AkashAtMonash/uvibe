"use client";

import { AlertTriangle } from "lucide-react";

const CFG = {
  fallback: {
    msg: "ARPANSA offline — showing Open-Meteo data",
    color: "var(--api-fallback-color)",
    bg: "var(--api-fallback-bg)",
    border: "var(--api-fallback-border)",
  },
  error: {
    msg: "All UV feeds unavailable — showing estimated reading",
    color: "var(--api-error-color)",
    bg: "var(--api-error-bg)",
    border: "var(--api-error-border)",
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
      <span style={{ display: 'flex' }}><AlertTriangle size={16} strokeWidth={2.5} /></span>
      {c.msg}
    </div>
  );
}
