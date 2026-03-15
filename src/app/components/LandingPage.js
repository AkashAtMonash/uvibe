"use client";

import { useState, useEffect } from "react";
import UVRing from "./UVRing";
import { getLevel, simulateUV } from "@/utils/uv";

const FEATURES = [
  {
    icon: "◎",
    title: "Real-Time UV Index",
    desc: "Live UV readings sourced from ARPANSA monitoring stations across Australia and refreshed regularly for better awareness.",
  },
  {
    icon: "◑",
    title: "Weather Context",
    desc: "See temperature, humidity, wind, and cloud conditions alongside your UV reading for more informed outdoor decisions.",
  },
  {
    icon: "◈",
    title: "Smart Protection",
    desc: "Get practical protection guidance like sunscreen use, clothing suggestions, and reminders based on UV intensity.",
  },
  {
    icon: "↗",
    title: "Awareness & Insights",
    desc: "Explore skin cancer risk, UV trends, and simple educational insights that help Australians stay safer in the sun.",
  },
];

const STATS = [
  { val: "2 in 3", label: "Australians diagnosed with skin cancer by age 70" },
  { val: "#1", label: "One of the highest skin cancer rates globally" },
  { val: "UV 11+", label: "Extreme UV levels reached regularly in Australia" },
];

export default function LandingPage({ onEnter }) {
  const [uv, setUv] = useState(0);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("Melbourne");

  useEffect(() => {
    const fetchUV = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/uv?city=Melbourne");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUv(parseFloat(data.uv));
        setCity("Melbourne");
      } catch {
        setUv(simulateUV("Melbourne"));
        setCity("Melbourne");
      }
      setLoading(false);
    };

    fetchUV();
  }, []);

  const lv = getLevel(uv);

  useEffect(() => {
    document.documentElement.style.setProperty("--uv", lv.color);
    document.documentElement.style.setProperty("--uv-10", lv.dim);
    document.documentElement.style.setProperty("--uv-20", lv.glow);
  }, [lv]);

  const uvMessage =
    uv <= 0
      ? "Check back during daylight hours"
      : uv <= 2
        ? "Low risk — safe to be outdoors right now"
        : uv <= 5
          ? "Moderate risk — wear SPF 30+ outdoors"
          : uv <= 7
            ? "High risk — SPF 50+ and protective clothing recommended"
            : uv <= 10
              ? "Very high risk — avoid peak sun and reapply protection"
              : "Extreme risk — stay indoors where possible";

  return (
    <div className="landing anim-fade-in">
      <div className="landing-bg">
        <div
          className="landing-orb"
          style={{
            width: 760,
            height: 760,
            top: "18%",
            left: "76%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${lv.glow} 0%, transparent 72%)`,
            filter: "blur(6px)",
            transition: "background 0.8s ease",
          }}
        />
        <div
          className="landing-orb"
          style={{
            width: 460,
            height: 460,
            top: "82%",
            left: "10%",
            background: `radial-gradient(circle, ${lv.dim} 0%, transparent 70%)`,
            animationDelay: "2s",
            filter: "blur(8px)",
            transition: "background 0.8s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            opacity: 0.2,
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.2))",
          }}
        />
      </div>

      <nav
        className="landing-nav"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        <div className="landing-logo" style={{ gap: 12 }}>
          <div
            className="landing-logo-mark"
            style={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${lv.color}20, ${lv.color}08)`,
              border: `1px solid ${lv.color}30`,
              boxShadow: `0 10px 30px ${lv.dim}`,
              fontSize: 20,
            }}
          >
            ☀
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>UVibe</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--fg-3)",
                letterSpacing: 1.6,
                textTransform: "uppercase",
              }}
            >
              UV Safety · Australia
            </span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            color: "var(--fg-2)",
            fontSize: 12,
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "999px",
              background: lv.color,
              boxShadow: `0 0 16px ${lv.color}`,
            }}
          />
          Live monitoring enabled
        </div>
      </nav>

      <section
        className="landing-hero"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40,
          alignItems: "center",
          paddingTop: 56,
          paddingBottom: 56,
        }}
      >
        <div
          style={{
            maxWidth: 620,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            className="landing-eyebrow anim-fade-up"
            style={{
              display: "inline-flex",
              width: "fit-content",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              borderRadius: 999,
              background: `linear-gradient(180deg, ${lv.color}12, transparent)`,
              border: `1px solid ${lv.color}25`,
              color: lv.color,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: lv.color,
                boxShadow: `0 0 14px ${lv.color}`,
              }}
            />
            Real-Time UV Protection
          </div>

          <h1
            className="landing-headline anim-fade-up"
            style={{
              textAlign: "left",
              margin: 0,
              fontSize: "clamp(2.8rem, 7vw, 5.4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              maxWidth: 640,
            }}
          >
            Know your
            <br />
            <span
              className="landing-headline-accent"
              style={{
                background: `linear-gradient(135deg, ${lv.color}, #ffffff)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              UV risk
            </span>
            <br />
            before you go out
          </h1>

          <p
            className="landing-sub anim-fade-up"
            style={{
              textAlign: "left",
              margin: 0,
              maxWidth: 580,
              fontSize: 18,
              lineHeight: 1.75,
              color: "var(--fg-2)",
            }}
          >
            Live UV data from ARPANSA monitoring stations across Australia,
            paired with practical sun-safety guidance so you can make smarter
            outdoor decisions in seconds.
          </p>

          <div
            className="landing-cta anim-fade-up"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 14,
              marginTop: 6,
            }}
          >
            <button
              className="btn btn-uv btn-lg"
              onClick={onEnter}
              style={{
                background: lv.color,
                color: "#fff",
                boxShadow: `0 12px 34px ${lv.dim}`,
                border: "none",
                paddingInline: 22,
              }}
            >
              Check My UV Index →
            </button>

            <button
              className="btn btn-outline btn-lg"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                backdropFilter: "blur(10px)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              Explore Features
            </button>
          </div>

          <div
            className="anim-fade-up"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 4,
            }}
          >
            {["ARPANSA Data", "Australia Focused", "Actionable Alerts"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--fg-2)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          className="anim-scale-in"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
              border: `1px solid ${lv.color}28`,
              borderRadius: "28px",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "relative",
              overflow: "hidden",
              backdropFilter: "blur(18px)",
              boxShadow: `0 20px 80px rgba(0,0,0,0.25), 0 0 0 1px ${lv.color}10 inset`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse 90% 70% at 50% 20%, ${lv.color}18 0%, transparent 68%)`,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {city} · Live UV
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--fg)",
                  }}
                >
                  Current UV Conditions
                </div>
              </div>

              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: `${lv.color}18`,
                  border: `1px solid ${lv.color}30`,
                  color: lv.color,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {loading ? "Loading..." : lv.label}
              </div>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                placeItems: "center",
                padding: "8px 0",
              }}
            >
              <UVRing uv={uv} color={lv.color} size={240} loading={loading} />
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                padding: "14px 16px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${lv.color}24`,
                color: "var(--fg)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  marginBottom: 8,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Recommendation
              </div>
              <div
                style={{
                  color: uv > 0 ? lv.color : "var(--fg-2)",
                  fontSize: 14,
                  lineHeight: 1.65,
                  fontWeight: 500,
                }}
              >
                {uvMessage}
              </div>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    marginBottom: 6,
                  }}
                >
                  Source
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>ARPANSA</div>
              </div>

              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    marginBottom: 6,
                  }}
                >
                  Refresh
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>~5 min</div>
              </div>

              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    marginBottom: 6,
                  }}
                >
                  Location
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{city}</div>
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--fg-3)",
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              UV data courtesy of ARPANSA
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-stats anim-fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "22px 20px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.035)",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              className="landing-stat-val"
              style={{
                color: i === 0 ? lv.color : "var(--fg)",
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                marginBottom: 10,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {s.val}
            </div>
            <div
              className="landing-stat-label"
              style={{
                color: "var(--fg-2)",
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </section>

      <section
        id="features"
        className="landing-features"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginTop: 28,
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="landing-feature anim-fade-up"
            style={{
              padding: 24,
              borderRadius: 24,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: "1px solid var(--border)",
              backdropFilter: "blur(10px)",
              transition: "transform 0.25s ease, border-color 0.25s ease",
            }}
          >
            <div
              className="landing-feature-icon"
              style={{
                color: lv.color,
                fontSize: 28,
                marginBottom: 18,
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                borderRadius: 16,
                background: `${lv.color}14`,
                border: `1px solid ${lv.color}22`,
              }}
            >
              {f.icon}
            </div>

            <div
              className="landing-feature-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 10,
                letterSpacing: "-0.02em",
              }}
            >
              {f.title}
            </div>

            <div
              className="landing-feature-desc"
              style={{
                color: "var(--fg-2)",
                lineHeight: 1.7,
                fontSize: 14.5,
              }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </section>

      <footer
        className="landing-footer"
        style={{
          marginTop: 48,
          paddingTop: 28,
          paddingBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          className="landing-footer-text"
          style={{
            color: "var(--fg-3)",
            lineHeight: 1.6,
          }}
        >
          UV data courtesy of ARPANSA · Weather context by OpenWeather
        </div>

        <button
          className="btn btn-uv"
          onClick={onEnter}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            background: lv.color,
            boxShadow: `0 8px 24px ${lv.dim}`,
            border: "none",
          }}
        >
          Get Started →
        </button>
      </footer>
    </div>
  );
}
