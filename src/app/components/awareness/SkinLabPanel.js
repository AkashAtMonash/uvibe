"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Loader2, Eye, ShieldCheck, Zap } from "lucide-react";
import { FITZPATRICK_TYPES } from "./data";

async function analyzeSkin(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/analyze-skin", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "ML analysis failed");
  }
  return res.json();
}


export default function SkinLabPanel() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeSkin(image);
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const fitz = result ? FITZPATRICK_TYPES.find((f) => f.type === result.fitzpatrick_type) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header callout */}
      <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #ede9fe, #f5f3ff)", borderRadius: 16, border: "1.5px solid #c4b5fd", fontSize: 13 }}>
        <strong>🔬 Skin Type Analysis (ML)</strong> — Upload a photo of your skin to detect your Fitzpatrick type. The model analyses tone, markers, and UV vulnerability to personalise your burn-time recommendations.
      </div>

      {/* Upload area */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2.5px dashed var(--border, rgba(0,0,0,0.12))",
            borderRadius: 20, padding: "48px 32px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            cursor: "pointer", textAlign: "center", transition: "background 0.2s",
            background: "var(--bg-3, #f9fafb)",
          }}
        >
          <Upload size={32} style={{ color: "#7c3aed" }} strokeWidth={1.5} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>Drop a photo here or click to browse</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 500 }}>JPG, PNG — photo of your inner forearm gives best results.</div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "2px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Skin sample" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
          <button onClick={clear} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Analyse button */}
      {preview && !result && (
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            padding: "14px", borderRadius: 16, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "var(--bg-3)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: loading ? "var(--fg-3)" : "#fff", fontSize: 14, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Analysing…</> : <><Eye size={18} strokeWidth={2.5} /> Analyse Skin Type</>}
        </button>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: 12, border: "1.5px solid #fca5a5", fontSize: 13, color: "#dc2626" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && fitz && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: "18px 20px", background: "var(--bg-2, #fff)", border: "2px solid #c4b5fd", borderRadius: 20, boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: fitz.color, border: "3px solid #7c3aed", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{fitz.label} <span style={{ color: "#7c3aed" }}>({result.type_name ?? fitz.description})</span></div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>{fitz.description}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { icon: <Zap size={16} style={{ color: "#f97316" }} />, label: "UV Vulnerability", value: result.uv_vulnerability ?? `${(fitz.factor * 28).toFixed(0)}%` },
              { icon: <ShieldCheck size={16} style={{ color: "#16a34a" }} />, label: "Confidence", value: result.confidence ? `${(result.confidence * 100).toFixed(0)}%` : "—" },
              { icon: <Camera size={16} style={{ color: "#7c3aed" }} />, label: "Aging Multiplier", value: result.aging_multiplier ? `${result.aging_multiplier}×` : `${fitz.factor}×` },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ textAlign: "center", padding: "10px 8px", background: "var(--bg-3)", borderRadius: 12, border: "1.5px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{value}</div>
                <div style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {result.detected_markers?.length > 0 && (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #86efac", fontSize: 12 }}>
              <strong>Detected markers:</strong> {result.detected_markers.join(", ")}
            </div>
          )}

          <button onClick={clear} style={{ padding: "10px", borderRadius: 12, border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--fg-3)" }}>
            Try another photo
          </button>
        </div>
      )}
    </div>
  );
}
