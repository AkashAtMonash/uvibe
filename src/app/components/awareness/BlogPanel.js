"use client";

import { ExternalLink, BookOpen } from "lucide-react";

const ARTICLES = [
  {
    category: "Foundation",
    emoji: "☀️",
    items: [
      { title: "Understanding the UV Index", org: "Cancer Council Australia", url: "https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/uv-index", summary: "Official guide on how UVI is measured and what the levels mean for daily protection." },
      { title: "UV Radiation & Human Health", org: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation", summary: "World Health Organisation's comprehensive fact sheet on UV radiation exposure and health effects." },
      { title: "The Fitzpatrick Skin Type Scale", org: "AAD", url: "https://www.aad.org/public/everyday-care/sun-protection/sunscreen-patients/skin-type", summary: "How to identify your skin type and what it means for your sun protection needs." },
    ],
  },
  {
    category: "Australian-Specific",
    emoji: "🦘",
    items: [
      { title: "Slip, Slop, Slap Campaign", org: "Cancer Council AU", url: "https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety", summary: "Australia's iconic public health campaign, updated with modern sun-safety guidance." },
      { title: "Melanoma Statistics — Australia", org: "AIHW 2025", url: "https://www.aihw.gov.au/reports/cancer/cancer-data-in-australia/contents/cancer-by-type/melanoma", summary: "Latest state-by-state melanoma incidence data from the Australian Institute of Health and Welfare." },
      { title: "ARPANSA UV Monitoring Network", org: "ARPANSA", url: "https://www.arpansa.gov.au/our-services/monitoring/ultraviolet-radiation-monitoring", summary: "Australia's real-time UV monitoring stations—the same data source used in this app." },
    ],
  },
  {
    category: "Science & Research",
    emoji: "🔬",
    items: [
      { title: "Sunscreen Efficacy & The 2mg/cm² Standard", org: "TGA", url: "https://www.tga.gov.au/resources/resource/guidance/sunscreens", summary: "Why most people get less protection than the label claims—the critical 2mg/cm² application rule explained." },
      { title: "Ozone Layer & UV Intensity in Australia", org: "BoM", url: "http://www.bom.gov.au/uv/", summary: "Bureau of Meteorology's explainer on how the thinning ozone layer concentrates UV in southern Australia." },
      { title: "Cool Days Can Still Burn — UV vs. Temperature", org: "SunSmart", url: "https://www.sunsmart.com.au/tools/uv-alert", summary: "Why UV radiation and heat are independent—and why cloudy, cool days still require protection." },
    ],
  },
];

export default function BlogPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {ARTICLES.map(({ category, emoji, items }) => (
        <div key={category}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--fg-3)", letterSpacing: "0.07em", marginBottom: 10 }}>
            {emoji} {category.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  padding: "14px 18px", borderRadius: 16, border: "1.5px solid var(--border, rgba(0,0,0,0.08))",
                  background: "var(--bg-2, #fff)", display: "flex", gap: 14, alignItems: "flex-start",
                  transition: "border-color 0.2s, box-shadow 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border, rgba(0,0,0,0.08))"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <BookOpen size={18} strokeWidth={1.5} style={{ color: "#7c3aed", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", marginBottom: 3 }}>{article.title}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>{article.org}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>{article.summary}</div>
                  </div>
                  <ExternalLink size={14} strokeWidth={2} style={{ color: "var(--fg-3)", flexShrink: 0, marginTop: 2 }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
