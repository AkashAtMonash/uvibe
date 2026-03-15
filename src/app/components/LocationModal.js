"use client";

export default function LocationModal({ onAllow, onDeny }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-icon">◎</div>
        <div className="modal-title">Your Location</div>
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
          <button className="btn btn-uv" onClick={onAllow} style={{ flex: 2 }}>
            Allow Location
          </button>
        </div>
      </div>
    </div>
  );
}
