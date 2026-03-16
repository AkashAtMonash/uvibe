"use client";

import { MapPin } from "lucide-react";

export default function LocationModal({ onAllow, onDeny }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-icon" style={{ display: 'flex', color: 'var(--uv-color)' }}>
          <MapPin size={32} strokeWidth={2} />
        </div>
        <div className="modal-title">Use Your Location?</div>
        <div className="modal-desc">
          UVibe finds your nearest ARPANSA UV monitoring station to deliver
          real-time, localised UV data.
        </div>
        <div className="modal-note">
          <strong>Privacy:</strong> Your GPS coordinates are only used to match
          the nearest city. They are never stored or sent to our servers.
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={onDeny}
            style={{ flex: 1 }}
          >
            Use Melbourne
          </button>
          <button
            className="btn btn-primary"
            onClick={onAllow}
            aria-label="Allow location access"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
              color: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)"
            }}
          >
            Allow Location
          </button>
        </div>
      </div>
    </div>
  );
}
