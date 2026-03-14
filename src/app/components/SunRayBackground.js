"use client";
// src/components/SunRayBackground.js

export default function SunRayBackground({ color, uv }) {
  const intensity = Math.min(uv / 13, 1);
  const rayCount = 12;
  const opacity = 0.04 + intensity * 0.1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <radialGradient id="rayCore" cx="50%" cy="38%" r="18%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          {Array.from({ length: rayCount }, (_, i) => (
            <linearGradient
              key={i}
              id={`ray${i}`}
              x1="50%"
              y1="38%"
              x2={`${50 + Math.cos((i / rayCount) * 2 * Math.PI) * 80}%`}
              y2={`${38 + Math.sin((i / rayCount) * 2 * Math.PI) * 80}%`}
            >
              <stop offset="0%" stopColor={color} stopOpacity={opacity * 1.8} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: rayCount }, (_, i) => {
          const angle = (i / rayCount) * 360;
          const rad = (angle * Math.PI) / 180;
          const cx = 200;
          const cy = 152;
          const len = 320 + intensity * 60;
          const width = 18 + intensity * 14;
          const ex = cx + Math.cos(rad) * len;
          const ey = cy + Math.sin(rad) * len;
          const nx = -Math.sin(rad) * (width / 2);
          const ny = Math.cos(rad) * (width / 2);
          const animDur = 6 + (i % 4) * 1.4;
          const animDel = (i / rayCount) * -4;

          return (
            <polygon
              key={i}
              points={`
                ${cx + nx},${cy + ny}
                ${cx - nx},${cy - ny}
                ${ex},${ey}
              `}
              fill={`url(#ray${i})`}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: `rayPulse ${animDur}s ease-in-out ${animDel}s infinite`,
              }}
            />
          );
        })}

        <circle cx="200" cy="152" r="52" fill="url(#rayCore)" />

        <style>{`
          @keyframes rayPulse {
            0%, 100% { opacity: 1; transform: scaleY(1); }
            50%       { opacity: 0.55; transform: scaleY(0.88); }
          }
        `}</style>
      </svg>
    </div>
  );
}
