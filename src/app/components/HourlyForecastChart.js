// src/app/components/HourlyForecastChart.js
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { UV_RISK_LEVELS } from "./DashboardWidgets";

const W = 800;
const H = 140;
const PAD = { top: 16, right: 12, bottom: 36, left: 28 };

const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function uvColor(val) {
  const lvl =
    UV_RISK_LEVELS.find((l) => val >= l.min && val <= l.max) ||
    UV_RISK_LEVELS[0];
  return lvl.color;
}

function buildPath(pts) {
  return pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cx = prev.x + (pt.x - prev.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, "");
}

export default function HourlyForecastChart({ hourly = [], city = "" }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);

  // Find current hour index
  const nowHour = new Date().getHours();
  const nowIdx = hourly.findIndex((h) => {
    const hh = h.hour ? parseInt(h.hour.slice(-2), 10) : -1;
    return hh === nowHour;
  });

  const allVals = hourly.flatMap((h) =>
    [h.measured, h.forecast].filter((v) => v != null),
  );
  const maxVal = Math.max(...allVals, 3);

  const xOf = (i) =>
    hourly.length <= 1
      ? PAD.left
      : PAD.left + (i / (hourly.length - 1)) * innerW;
  const yOf = (v) =>
    v == null ? null : PAD.top + innerH - clamp(v / maxVal, 0, 1) * innerH;

  const measuredPts = hourly
    .map((h, i) => ({ x: xOf(i), y: yOf(h.measured), v: h.measured, i }))
    .filter((p) => p.y != null);

  const forecastPts = hourly
    .map((h, i) => ({ x: xOf(i), y: yOf(h.forecast), v: h.forecast, i }))
    .filter((p) => p.y != null);

  const measuredPath = buildPath(measuredPts);
  const forecastPath = buildPath(forecastPts);

  const areaPath = measuredPts.length
    ? buildPath(measuredPts) +
      ` L${measuredPts.at(-1).x},${PAD.top + innerH} L${measuredPts[0].x},${PAD.top + innerH} Z`
    : "";

  // Mouse interaction
  const handleMove = useCallback(
    (e) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const idx = clamp(
        Math.round(((svgX - PAD.left) / innerW) * (hourly.length - 1)),
        0,
        hourly.length - 1,
      );
      const h = hourly[idx];
      const x = xOf(idx);
      const val = h.measured ?? h.forecast ?? 0;
      const y = yOf(val) ?? PAD.top;
      const hh = h.hour ? parseInt(h.hour.slice(-2), 10) : idx;
      const label =
        hh === 0
          ? "12am"
          : hh < 12
            ? `${hh}am`
            : hh === 12
              ? "12pm"
              : `${hh - 12}pm`;
      setTooltip({
        idx,
        x,
        y,
        val,
        label,
        measured: h.measured,
        forecast: h.forecast,
      });
      setHoveredIdx(idx);
    },
    [hourly],
  );

  const handleLeave = () => {
    setTooltip(null);
    setHoveredIdx(null);
  };

  // Early return AFTER all hooks — Rules of Hooks compliance
  if (!hourly.length) return null;

  // Y-axis labels: 0, 3, 6, 8, 11
  const yLabels = [0, 3, 6, 8, 11].filter((v) => v <= maxVal + 0.5);

  // X-axis: every 3 hours
  const xLabels = hourly
    .map((h, i) => {
      const hh = h.hour ? parseInt(h.hour.slice(-2), 10) : -1;
      if (hh % 3 !== 0 && i !== nowIdx) return null;
      const label =
        hh === 0
          ? "12am"
          : hh < 12
            ? `${hh}am`
            : hh === 12
              ? "12pm"
              : `${hh - 12}pm`;
      return { i, label, isNow: i === nowIdx };
    })
    .filter(Boolean);

  const nowPt =
    nowIdx >= 0
      ? {
          x: xOf(nowIdx),
          y:
            yOf(hourly[nowIdx]?.measured ?? hourly[nowIdx]?.forecast ?? 0) ??
            PAD.top,
        }
      : null;

  const peakIdx = hourly.reduce((pi, h, i) => {
    const v = h.measured ?? h.forecast ?? 0;
    const pv = hourly[pi]?.measured ?? hourly[pi]?.forecast ?? 0;
    return v > pv ? i : pi;
  }, 0);
  const peakVal = hourly[peakIdx]?.measured ?? hourly[peakIdx]?.forecast ?? 0;
  const peakHH = hourly[peakIdx]?.hour
    ? parseInt(hourly[peakIdx].hour.slice(-2), 10)
    : 0;
  const peakLabel =
    peakHH === 0
      ? "12am"
      : peakHH < 12
        ? `${peakHH}am`
        : peakHH === 12
          ? "12pm"
          : `${peakHH - 12}pm`;
  const peakLvl =
    UV_RISK_LEVELS.find((l) => peakVal >= l.min && peakVal <= l.max) ||
    UV_RISK_LEVELS[0];

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--text-3)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Today's UV — {city}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {peakVal > 0 && (
            <div
              style={{
                fontSize: 10,
                color: peakLvl.color,
                fontFamily: "var(--mono)",
                fontWeight: 700,
                background: `${peakLvl.color}22`,
                padding: "4px 10px",
                borderRadius: 20,
              }}
            >
              Peak {peakVal.toFixed(1)} at {peakLabel}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <LegendDot
              color="var(--uv-color, #f97316)"
              solid
              label="Measured"
            />
            <LegendDot
              color="var(--uv-color, #f97316)"
              solid={false}
              label="Forecast"
            />
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "100%",
            height: "auto",
            overflow: "visible",
            cursor: "crosshair",
          }}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          <defs>
            <linearGradient id="hfcFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--uv-color, #f97316)"
                stopOpacity="0.30"
              />
              <stop
                offset="100%"
                stopColor="var(--uv-color, #f97316)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>

          {/* Y grid + labels */}
          {yLabels.map((v) => {
            const y = yOf(v);
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 5}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--mono, monospace)"
                  fill="currentColor"
                  opacity="0.4"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#hfcFill)" />}

          {/* Forecast line — dashed */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="var(--uv-color, #f97316)"
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              opacity="0.5"
            />
          )}

          {/* Measured line — solid */}
          {measuredPath && (
            <path
              d={measuredPath}
              fill="none"
              stroke="var(--uv-color, #f97316)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover vertical + dot */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x}
                y1={PAD.top}
                x2={tooltip.x}
                y2={PAD.top + innerH}
                stroke="var(--uv-color, #f97316)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.6"
              />
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r="5"
                fill="var(--uv-color, #f97316)"
                stroke="var(--bg-2, #111)"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* NOW marker */}
          {nowPt && !tooltip && (
            <>
              <line
                x1={nowPt.x}
                y1={PAD.top}
                x2={nowPt.x}
                y2={PAD.top + innerH}
                stroke="var(--uv-color, #f97316)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.9"
              />
              <circle
                cx={nowPt.x}
                cy={nowPt.y}
                r="5"
                fill="var(--uv-color, #f97316)"
                stroke="var(--bg-2, #111)"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* X-axis labels */}
          {xLabels.map(({ i, label, isNow }) => (
            <text
              key={i}
              x={xOf(i)}
              y={H - 4}
              textAnchor={
                i === 0 ? "start" : i === hourly.length - 1 ? "end" : "middle"
              }
              fontSize={isNow ? "12" : "10"}
              fontWeight={isNow ? "800" : "600"}
              fontFamily="var(--mono, monospace)"
              fill={isNow ? "var(--uv-color, #f97316)" : "currentColor"}
              opacity={isNow ? "1" : "0.4"}
            >
              {isNow ? "NOW" : label}
            </text>
          ))}
        </svg>

        {/* Floating tooltip */}
        {tooltip && <TooltipBubble tooltip={tooltip} svgW={W} />}
      </div>

      {/* Source attribution */}
      <div
        style={{
          fontSize: 9,
          fontFamily: "var(--mono)",
          color: "var(--text-3)",
          marginTop: 6,
          opacity: 0.5,
        }}
      >
        UV observations courtesy of ARPANSA · Auto-refreshes every 5 min
      </div>
    </div>
  );
}

function LegendDot({ color, solid, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width="20" height="4">
        <line
          x1="0"
          y1="2"
          x2="20"
          y2="2"
          stroke={color}
          strokeWidth={solid ? "2.5" : "1.5"}
          strokeDasharray={solid ? "none" : "4 3"}
          opacity={solid ? "1" : "0.6"}
        />
      </svg>
      <span
        style={{
          fontSize: 9,
          fontFamily: "var(--mono)",
          color: "var(--text-3)",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TooltipBubble({ tooltip, svgW }) {
  const tipW = 148;
  // Position tooltip above the cursor, clamp to SVG bounds
  const leftPct = (tooltip.x / svgW) * 100;
  const leftPx = `clamp(0px, calc(${leftPct}% - ${tipW / 2}px), calc(100% - ${tipW}px))`;
  const lvl =
    UV_RISK_LEVELS.find((l) => tooltip.val >= l.min && tooltip.val <= l.max) ||
    UV_RISK_LEVELS[0];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% - 24px)",
        left: leftPx,
        width: tipW,
        background: "var(--bg-2)",
        border: `1px solid ${lvl.color}50`,
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          fontFamily: "var(--mono)",
          color: "var(--text-3)",
          marginBottom: 6,
        }}
      >
        {tooltip.label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tooltip.measured != null && (
          <Row
            label="Measured"
            val={tooltip.measured}
            color={lvl.color}
            solid
          />
        )}
        {tooltip.forecast != null && (
          <Row
            label="Forecast"
            val={tooltip.forecast}
            color={lvl.color}
            solid={false}
          />
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          padding: "4px 8px",
          borderRadius: 6,
          background: `${lvl.color}18`,
          fontSize: 10,
          fontWeight: 800,
          color: lvl.color,
          textAlign: "center",
        }}
      >
        {lvl.label}
      </div>
    </div>
  );
}

function Row({ label, val, color, solid }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <svg width="14" height="3">
          <line
            x1="0"
            y1="1.5"
            x2="14"
            y2="1.5"
            stroke={color}
            strokeWidth={solid ? "2.5" : "1.5"}
            strokeDasharray={solid ? "none" : "3 2"}
            opacity={solid ? "1" : "0.6"}
          />
        </svg>
        <span
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            fontFamily: "var(--mono)",
          }}
        >
          {label}
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>
        {val.toFixed(1)}
      </span>
    </div>
  );
}
