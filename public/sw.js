self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "UVibe Alert",
      body: event.data.text(),
      icon: "/icons/icon-256.png",
    };
  }

  const options = {
    body: payload.body ?? "Check your UV index now.",
    icon: payload.icon ?? "/icons/icon-256.png",
    badge: "/icons/icon-256.png",
    tag: payload.tag ?? "uvibe-alert",
    data: { url: payload.url ?? "/" },
    actions: [
      { action: "open", title: "View UV Index" },
      { action: "dismiss", title: "Dismiss" },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: payload.urgent ?? false,
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.title ?? "UVibe UV Alert",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        const existing = list.find((c) => c.url.includes(self.location.origin));
        if (existing) return existing.focus();
        return clients.openWindow(url);
      }),
  );
});
