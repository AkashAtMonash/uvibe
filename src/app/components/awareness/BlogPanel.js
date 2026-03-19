"use client";

import { ExternalLink, BookOpen, PlayCircle } from "lucide-react";

// Working, verified links as requested
const ARTICLES = [
  {
    title: "UV Radiation & Human Health",
    org: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation",
    summary: "Comprehensive global fact sheet detailing the exact impact of UV radiation on public health.",
    id: "art-1"
  },
  {
    title: "Slip, Slop, Slap, Seek, Slide",
    org: "Cancer Council Australia",
    url: "https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/campaigns-and-events/slip-slop-slap-seek-slide",
    summary: "Australia's gold standard framework for preventing skin cancer.",
    id: "art-2"
  },
  {
    title: "Understanding the UV Index",
    org: "Bureau of Meteorology (BOM)",
    url: "http://www.bom.gov.au/uv/",
    summary: "The official Australian meteorological explanation of how the UV Index is forecasted daily.",
    id: "art-3"
  },
  {
    title: "Melanoma of the Skin Statistics",
    org: "AIHW",
    url: "https://www.aihw.gov.au/reports/cancer/cancer-data-in-australia/contents/overview",
    summary: "The latest verified registry data for melanoma incidence rates across Australia.",
    id: "art-4"
  },
];

const VIDEOS = [
  {
    title: "Dear 16-year-old me",
    org: "David Cornfield Melanoma Fund",
    id: "_4jgUcxMezM", // Famous melanoma awareness video
    summary: "A profound message about the devastating suddenness of Melanoma from those who know it best."
  },
  {
    title: "How to protect yourself from the sun's rays?",
    org: "SBS On Demand",
    id: "SlXptZfWjJM", // Animated science of sunscreen
    summary: "Australia has one of the highest rates of skin cancer in the world. Most skin cancers, including melanoma, occur after damage to skin cells from unprotected exposure to ultraviolet radiation from the sun."
  }
];

export default function BlogPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Videos Section */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--fg)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <PlayCircle size={18} style={{ color: "#ef4444" }} /> Essential Viewing
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {VIDEOS.map(vid => (
            <div key={vid.id} style={{
              background: "var(--bg-2, #fff)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column"
            }}>
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${vid.id}?modestbranding=1&rel=0`}
                  title={vid.title}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>{vid.title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>{vid.org}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>{vid.summary}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Articles Section */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--fg)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={18} style={{ color: "#3b82f6" }} /> Important Publications
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ARTICLES.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div style={{
                padding: "16px 20px", borderRadius: 16, border: "1.5px solid var(--border, rgba(0,0,0,0.08))",
                background: "var(--bg-2, #fff)", display: "flex", gap: 16, alignItems: "center",
                transition: "all 0.2s", cursor: "pointer",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border, rgba(0,0,0,0.08))"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={20} strokeWidth={2} style={{ color: "#3b82f6" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>{article.title}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "#3b82f6" }}>{article.org}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{article.summary}</span>
                  </div>
                </div>
                <ExternalLink size={18} strokeWidth={2.5} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
