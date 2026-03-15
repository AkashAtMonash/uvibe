"use client";

import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "uvibe_push_token";
const LOCATION_KEY = "uvibe_location";

export function useUserSync() {
  const [pushToken, setPushToken] = useState(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setPushToken(stored);
  }, []);

  const requestAndRegister = useCallback(async (prefs) => {
    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = `uvibe_${crypto.randomUUID()}`;

    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          skinType: prefs.skinType ?? "III",
          spfPreference: prefs.spf ?? 50,
          notifEnabled: prefs.notifEnabled ?? true,
        }),
      });

      localStorage.setItem(TOKEN_KEY, token);
      setPushToken(token);
      setSynced(true);

      const savedLocation = localStorage.getItem(LOCATION_KEY);
      if (savedLocation) {
        const { city } = JSON.parse(savedLocation);
        await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pushToken: token, cityName: city }),
        });
      }

      return token;
    } catch {
      return null;
    }
  }, []);

  const syncPrefs = useCallback(async (prefs) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          displayName: prefs.name ?? null,
          ageGroup: prefs.ageRange ?? null,
          skinType: prefs.skinType,
          spfPreference: prefs.spf,
          notifEnabled: prefs.notifEnabled ?? false,
        }),
      });
    } catch {
      // silent fail — prefs still saved in localStorage
    }
  }, []);

  const syncCity = useCallback(async (cityName) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushToken: token, cityName }),
      });
    } catch {
      // silent fail
    }
  }, []);

  const saveReading = useCallback(
    async (locationName, uvIndex, dataSource = "arpansa") => {
      try {
        await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName, uvIndex, dataSource }),
        });
      } catch {
        // silent fail — reading logging is best-effort
      }
    },
    [],
  );

  return {
    pushToken,
    synced,
    requestAndRegister,
    syncPrefs,
    syncCity,
    saveReading,
  };
}
