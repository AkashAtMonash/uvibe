"use client";

import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "uvibe_push_token";
const LOCATION_KEY = "uvibe_location";
const SW_REG_KEY = "uvibe_sw_registered";

function urlBase64ToUint8Array(base64String) {
  if (!base64String) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const raw = atob(base64);
    return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
  } catch {
    throw new Error(
      "Malformed VAPID key — check NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env",
    );
  }
}

async function registerSWAndSubscribe(vapidKey) {
  if (!("serviceWorker" in navigator))
    throw new Error("Service workers not supported");
  if (!("PushManager" in window))
    throw new Error("Push not supported in this browser");
  if (!vapidKey)
    throw new Error(
      "VAPID key missing — add NEXT_PUBLIC_VAPID_PUBLIC_KEY to env vars",
    );

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  return sub;
}

export function useUserSync() {
  const [pushToken, setPushToken] = useState(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setPushToken(stored);
  }, []);

  const requestAndRegister = useCallback(async (prefs) => {
    if (!("Notification" in window))
      return { error: "Notifications not supported" };

    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      return { error: "Notification permission denied" };

    let token = localStorage.getItem(TOKEN_KEY);
    const isNewToken = !token;
    if (!token) token = `uvibe_${crypto.randomUUID()}`;

    try {
      // 1. Upsert user in DB
      const userRes = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          skinType: prefs.skinType ?? "III",
          spfPreference: prefs.spf ?? 50,
          notifEnabled: true,
        }),
      });
      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.error || "Failed to save user in database");
      }

      // 2. Register SW + get push subscription
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const subscription = await registerSWAndSubscribe(vapidKey);

      // 3. Save subscription to DB
      const subRes = await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          subscription: subscription.toJSON(),
        }),
      });
      if (!subRes.ok) throw new Error("Failed to save push subscription");

      // 4. Persist token locally
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SW_REG_KEY, "true");
      setPushToken(token);
      setSynced(true);

      // 5. Save city subscription for new users
      if (isNewToken) {
        const savedLoc = localStorage.getItem(LOCATION_KEY);
        if (savedLoc) {
          const { city } = JSON.parse(savedLoc);
          const cityName =
            typeof city === "string" ? city : (city?.name ?? "Melbourne");
          await fetch("/api/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushToken: token, cityName }),
          }).catch(() => {});
        }
      }

      return { success: true, token };
    } catch (err) {
      console.error("requestAndRegister error:", err.message);
      return { error: err.message };
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
    } catch {}
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
    } catch {}
  }, []);

  const saveReading = useCallback(
    async (locationName, uvIndex, dataSource = "arpansa") => {
      try {
        await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName, uvIndex, dataSource }),
        });
      } catch {}
    },
    [],
  );

  const sendTestNotification = useCallback(async (city, uv) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { error: "No push token — toggle UV Alerts ON first" };

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey)
        return { error: "NEXT_PUBLIC_VAPID_PUBLIC_KEY not set in .env.local" };

      const subscription = await registerSWAndSubscribe(vapidKey);
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          subscription: subscription.toJSON(),
        }),
      });
    } catch (err) {
      return { error: `SW registration failed: ${err.message}` };
    }

    try {
      const res = await fetch("/api/push-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pushToken: token,
          cityName: city ?? "Melbourne",
          uv: uv ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? data.detail ?? "Send failed" };
      return data;
    } catch (err) {
      return { error: err.message };
    }
  }, []);

  return {
    pushToken,
    synced,
    requestAndRegister,
    syncPrefs,
    syncCity,
    saveReading,
    sendTestNotification,
  };
}
