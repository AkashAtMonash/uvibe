"use client";
// src/components/UVGraph.js

import { useState, useEffect, useRef } from "react";
import { getLevel } from "@/utils/uv";

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function HourlyChart({ hourly, color, currentHourIdx }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  if (!hourly || hourly.length === 0) return null;

  const W = 600,
    H = 150,
    padL = 28,
    padR = 12,
    padT = 14,
    padB = 20;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allVals = hourly.flatMap((h) =>
    [h.forecast, h.measured].filter((v) => v != null),
  );
  const maxVal = Math.max(...allVals, 3);

  const xOf = (i) => padL + (i / (hourly.length - 1)) * innerW;
  const yOf = (v) =>
    v == null ? null : padT + innerH - clamp(v / maxVal, 0, 1) * innerH;

  const makePath = (key) =>
    hourly
      .map((h, i) => ({ x: xOf(i), y: yOf(h[key]), i }))
      .filter((p) => p.y != null)
      .reduce((acc, p, i, arr) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = arr[i - 1];
        return `${acc} C ${prev.x + 10} ${prev.y}, ${p.x - 10} ${p.y}, ${p.x} ${p.y}`;
      }, "");

  const forecastPath = makePath("forecast");
  const measuredPath = makePath("measured");

  const forecastFill =
    hourly
      .map((h, i) => ({ x: xOf(i), y: yOf(h.forecast), i }))
      .filter((p) => p.y != null)
      .reduce(
        (acc, p, i, arr) =>
          i === 0
            ? `M ${p.x} ${p.y}`
            : `${acc} C ${arr[i - 1].x + 10} ${arr[i - 1].y}, ${p.x - 10} ${p.y}, ${p.x} ${p.y}`,
        "",
      ) +
    ` L ${xOf(hourly.length - 1)} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  const yLabels = [0, 3, 6, 8, 11].filter((v) => v <= maxVal + 1);

  const handleMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = clamp(
      Math.round(((px - padL) / innerW) * (hourly.length - 1)),
      0,
      hourly.length - 1,
    );
    const h = hourly[idx];
    setTooltip({ idx, x: xOf(idx), y: yOf(h.forecast ?? h.measured), h });
  };

  return (
    <div style={{ position: "relative" }}>
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
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              <text
                x={padL - 4}
                y={y + 3}
                fontSize="8"
                fill="var(--fg-3)"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Hour labels */}
        {hourly.map((h, i) => {
          if (i % 3 !== 0) return null;
          const label = h.hour?.slice(11) ?? `${i}h`;
          return (
            <text
              key={i}
              x={xOf(i)}
              y={H - 3}
              fontSize="8"
              fill="var(--fg-3)"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {label}
            </text>
          );
        })}

        {/* Forecast fill */}
        {forecastFill && <path d={forecastFill} fill="url(#gFill)" />}

        {/* Forecast line */}
        {forecastPath && (
          <path
            d={forecastPath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
            strokeDasharray="5 3"
          />
        )}

        {/* Measured line */}
        {measuredPath && (
          <path
            d={measuredPath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Current time marker */}
        {currentHourIdx >= 0 &&
          currentHourIdx < hourly.length &&
          (() => {
            const cx = xOf(currentHourIdx);
            const mv = hourly[currentHourIdx];
            const cy = yOf(mv?.measured ?? mv?.forecast ?? 0) ?? padT;
            return (
              <>
                <line
                  x1={cx}
                  y1={padT}
                  x2={cx}
                  y2={padT + innerH}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  opacity="0.9"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={color}
                  stroke="var(--bg-2)"
                  strokeWidth="2"
                />
              </>
            );
          })()}

        {/* Hover tooltip */}
        {tooltip &&
          (() => {
            const tx = clamp(tooltip.x, 44, W - 80);
            return (
              <>
                <line
                  x1={tooltip.x}
                  y1={padT}
                  x2={tooltip.x}
                  y2={padT + innerH}
                  stroke="var(--fg-3)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                />
                <rect
                  x={tx - 40}
                  y={(tooltip.y ?? padT) - 28}
                  width={82}
                  height={22}
                  rx="5"
                  fill="var(--bg-3)"
                  stroke={`${color}50`}
                  strokeWidth="1"
                />
                <text
                  x={tx}
                  y={(tooltip.y ?? padT) - 13}
                  fontSize="9"
                  fill={color}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                >
                  {tooltip.h.hour?.slice(11) ?? ""} ·{" "}
                  {tooltip.h.measured != null
                    ? `UV ${tooltip.h.measured.toFixed(1)}`
                    : tooltip.h.forecast != null
                      ? `~${tooltip.h.forecast.toFixed(1)}`
                      : "—"}
                </text>
              </>
            );
          })()}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="20" height="4">
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
            }}
          >
            Measured
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="20" height="4">
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.6"
            />
          </svg>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
            }}
          >
            Forecast
          </span>
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-3)",
          }}
        >
          UV observations courtesy of ARPANSA
        </div>
      </div>
    </div>
  );
}

export default function UVGraph({ city, lv }) {
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError(null);
    fetch(`/api/uvgraph?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setHourly(data.hourly ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [city]);

  // Find current hour index by matching hour string to local time
  const currentHourIdx = (() => {
    if (!mounted || hourly.length === 0) return -1;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const match = ` ${hh}`; // ARPANSA hour format is "HH" as last 3 chars
    return hourly.findIndex(
      (h) => h.hour?.endsWith(match) || h.hour?.slice(-2) === hh,
    );
  })();

  const color = lv?.color ?? "#22d3aa";

  return (
    <div className="card anim-fade-up" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div className="divider-label label-sm" style={{ flex: 1 }}>
          Today's UV — {city}
        </div>
        <span
          style={{
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-3)",
          }}
        >
          ARPANSA
        </span>
      </div>

      {loading ? (
        <div
          style={{
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            className="spinner"
            style={{ width: 18, height: 18, borderTopColor: color }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
            }}
          >
            Loading ARPANSA data…
          </span>
        </div>
      ) : error ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
              marginBottom: 6,
            }}
          >
            ARPANSA graph unavailable
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{error}</div>
          <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4 }}>
            Run: npm install arpansa-uv-data
          </div>
        </div>
      ) : hourly.length === 0 ? (
        <div
          style={{
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
            }}
          >
            No data for today yet
          </span>
        </div>
      ) : (
        <HourlyChart
          hourly={hourly}
          color={color}
          currentHourIdx={currentHourIdx}
        />
      )}
    </div>
  );
}
