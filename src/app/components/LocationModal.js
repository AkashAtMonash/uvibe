"use client";

export default function LocationModal({ onAllow, onDeny }) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Location access request"
    >
      <div className="modal">
        <div className="modal-icon">📍</div>
        <div className="modal-title">Use Your Location?</div>
        <div className="modal-desc">
          UVibe finds your nearest ARPANSA monitoring station to show real-time,
          localised UV data.
        </div>
        <div className="modal-privacy">
          <strong>Privacy:</strong> Your GPS coordinates are only used to match
          the nearest city. They are never stored or sent to our servers.
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={onDeny}
            aria-label="Use Melbourne as default"
          >
            Use Melbourne
          </button>
          <button
            className="btn btn-primary"
            onClick={onAllow}
            aria-label="Allow location access"
            style={{ background: "linear-gradient(135deg, #22d3aa, #0ea5e9)" }}
          >
            Allow Location
          </button>
        </div>
      </div>
    </div>
  );
}
