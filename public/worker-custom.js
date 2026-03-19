self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "UVibe Alert";
    const options = {
      body: data.body || "Check your UV risk.",
      icon: data.icon || "/icons/icon-256.png",
      badge: "/icons/icon-256.png",
      vibrate: data.urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      data: {
        url: data.url || "/",
      },
      tag: data.tag || "uvibe-alert",
      requireInteraction: data.urgent || false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Push event error:", err);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Find an existing window/tab matching the URL
        let matchingClient = null;
        for (let client of windowClients) {
          if (client.url === new URL(urlToOpen, location.href).href) {
            matchingClient = client;
            break;
          }
        }
        // If found, bring it to focus, else open a new window
        if (matchingClient) {
          return matchingClient.focus();
        } else {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "REMINDER_ALARM") return;

  const { title, body } = event.data;

  event.waitUntil(
    self.registration.showNotification(
      title ?? "⏱ Time to Reapply Sunscreen!",
      {
        body: body ?? "Reapply your sunscreen now to stay protected.",
        icon: "/icons/icon-256.png",
        badge: "/icons/icon-256.png",
        tag: "uvibe-reminder",
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        data: { url: "/" },
        actions: [
          { action: "open", title: "Open UVibe" },
          { action: "dismiss", title: "Dismiss" },
        ],
      },
    ),
  );
});
