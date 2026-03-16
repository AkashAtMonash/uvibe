"use client";
// src/app/prevention/page.js

import { useState, useEffect } from "react";
import "@/app/globals.css";

import { getLevel, CITIES } from "@/utils/uv";
import { TABS } from "@/app/components/prevention/constants";
import SunscreenTab from "@/app/components/prevention/SunscreenTab";
import ReminderTab from "@/app/components/prevention/ReminderTab";
import ClothingTab from "@/app/components/prevention/ClothingTab";
import GuideTab from "@/app/components/prevention/GuideTab";
import { Droplets, Clock, Shirt, FileText } from "lucide-react";

export default function PreventionPage() {
  const [activeTab, setActiveTab] = useState("sunscreen");
  const [uv, setUv] = useState(0);
  const [city, setCity] = useState("Melbourne");

  useEffect(() => {
    const saved = localStorage.getItem("uvibe_location");
    if (saved) {
      const { city: c } = JSON.parse(saved);
      setCity(c);
    }
  }, []);

  useEffect(() => {
    const fetchUV = async () => {
      try {
        const arpansa = CITIES[city]?.arpansa ?? "Melbourne";
        const res = await fetch(`/api/uv?city=${encodeURIComponent(arpansa)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUv(parseFloat(data.uv));
      } catch {
        const hr = new Date().getHours();
        const mod = hr >= 10 && hr <= 14 ? 1 : hr < 8 || hr > 18 ? 0.04 : 0.6;
        setUv(parseFloat((7.9 * mod).toFixed(1)));
      }
    };
    fetchUV();
  }, [city]);

  const lv = getLevel(uv);

  useEffect(() => {
    document.documentElement.style.setProperty("--uv-color", lv.color);
    document.documentElement.style.setProperty("--uv-dim", lv.dim);
    document.documentElement.style.setProperty("--uv-glow", lv.glow);
  }, [lv]);

  const getTabIcon = (id) => {
    switch (id) {
      case "sunscreen": return <Droplets size={18} strokeWidth={2.5} />;
      case "reminder": return <Clock size={18} strokeWidth={2.5} />;
      case "clothing": return <Shirt size={18} strokeWidth={2.5} />;
      case "guide": return <FileText size={18} strokeWidth={2.5} />;
      default: return null;
    }
  };

  return (
    <div className="prev-page fade-in">
      <div className="prev-header">
        <div className="prev-header-top">
          <div>
            <div className="prev-title">Prevention</div>
            <div className="prev-subtitle">
              {city} · UV {uv.toFixed(1)} ·{" "}
              <span style={{ color: lv.color }}>{lv.name}</span>
            </div>
          </div>
          <div
            className="prev-uv-badge"
            style={{
              background: lv.dim,
              borderColor: `${lv.color}50`,
              color: lv.color,
            }}
          >
            UV {uv.toFixed(1)}
          </div>
        </div>

        <div className="prev-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`prev-tab ${activeTab === tab.id ? "on" : ""}`}
              style={
                activeTab === tab.id
                  ? { borderBottomColor: lv.color, color: lv.color }
                  : {}
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ display: 'flex', marginBottom: 4 }}>{getTabIcon(tab.id)}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="prev-body">
        {activeTab === "sunscreen" && <SunscreenTab lv={lv} uv={uv} />}
        {activeTab === "reminder" && <ReminderTab lv={lv} uv={uv} />}
        {activeTab === "clothing" && <ClothingTab lv={lv} uv={uv} />}
        {activeTab === "guide" && <GuideTab lv={lv} />}
      </div>
    </div>
  );
}
