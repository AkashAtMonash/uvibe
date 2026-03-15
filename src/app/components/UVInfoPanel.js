"use client";

const INFO = [
  {
    icon: "◎",
    title: "What is the UV Index?",
    body: "The UV Index measures the intensity of ultraviolet radiation from the sun on a scale from 0 to 11+. Australia consistently records some of the highest UV levels on Earth due to its proximity to the equator and thinner ozone layer.",
  },
  {
    icon: "↗",
    title: "Why UV is Dangerous in Australia",
    body: "Australia has the world's highest skin cancer rate. Two in three Australians will be diagnosed with skin cancer by age 70. The ozone layer is thinner over the southern hemisphere, and the Earth is closest to the sun during Australian summer.",
  },
  {
    icon: "◈",
    title: "How to Read the UV Scale",
    body: "UV 0–2 is Low (safe). UV 3–5 is Moderate (SPF required). UV 6–7 is High (SPF 50+ essential). UV 8–10 is Very High (avoid peak hours). UV 11+ is Extreme — permanent skin damage can occur in under 10 minutes.",
  },
  {
    icon: "◑",
    title: "What SPF Means",
    body: "SPF (Sun Protection Factor) measures how effectively sunscreen blocks UV. SPF 50 blocks 98% of UVB rays. Cancer Council Australia recommends SPF 50+ applied 20 minutes before sun exposure, reapplied every 2 hours.",
  },
];

export default function UVInfoPanel({ onClose }) {
  return (
    <>
      <div className="info-panel-overlay" onClick={onClose} />
      <div className="info-panel" role="dialog" aria-label="UV Information">
        <div className="info-panel-handle" />
        <div className="info-panel-title">About UV Index</div>
        {INFO.map((item, i) => (
          <div key={i} className="info-card-item">
            <div className="info-card-item-icon">{item.icon}</div>
            <div className="info-card-item-title">{item.title}</div>
            <div className="info-card-item-body">{item.body}</div>
          </div>
        ))}
        <button
          className="btn btn-outline"
          style={{ width: "100%", marginTop: 16 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </>
  );
}
