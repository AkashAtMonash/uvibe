import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CITIES = {
  Melbourne: { lat: -37.81, lon: 144.96 },
  Sydney: { lat: -33.87, lon: 151.21 },
  Brisbane: { lat: -27.47, lon: 153.03 },
  Adelaide: { lat: -34.93, lon: 138.6 },
  Perth: { lat: -31.95, lon: 115.86 },
  Darwin: { lat: -12.46, lon: 130.84 },
  Hobart: { lat: -42.88, lon: 147.33 },
  Canberra: { lat: -35.28, lon: 149.13 },
  Townsville: { lat: -19.26, lon: 146.82 },
  "Alice Springs": { lat: -23.7, lon: 133.88 },
  "Gold Coast": { lat: -28.0, lon: 153.43 },
  Newcastle: { lat: -32.93, lon: 151.78 },
  Emerald: { lat: -23.52, lon: 148.16 },
};

function uvLevel(uv) {
  if (uv >= 11) return "Extreme";
  if (uv >= 8) return "Very High";
  if (uv >= 6) return "High";
  if (uv >= 3) return "Moderate";
  return "Low";
}

function uvPrevention(uv) {
  if (uv >= 11)
    return "Stay indoors. If outside, full UPF 50+ coverage, SPF 50+ sunscreen every 2 hrs, broad-brim hat and UV400 glasses mandatory.";
  if (uv >= 8)
    return "Avoid peak hours (10am–3pm). Apply SPF 50+, wear UPF 30+ clothing, wide-brim hat and sunglasses.";
  if (uv >= 6)
    return "SPF 50+ essential before going outside. Reapply every 2 hours. Wear a hat and sunglasses.";
  if (uv >= 3)
    return "Wear SPF 30+ and a hat. Seek shade during peak UV hours.";
  return "Low UV today. No special protection required.";
}

function burnTime(uv) {
  if (!uv || uv <= 0) return null;
  const bare = Math.max(3, Math.round(200 / (3 * uv)));
  const prot = Math.max(10, Math.round(bare * Math.sqrt(50 / 15)));
  return { bare, prot };
}

async function fetchWeatherForCity(cityName) {
  const c = CITIES[cityName];
  if (!c || !process.env.OPENWEATHER_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      temp: Math.round(d.main?.temp ?? 0),
      feelsLike: Math.round(d.main?.feels_like ?? 0),
      humidity: d.main?.humidity ?? 0,
      windSpeed: Math.round((d.wind?.speed ?? 0) * 3.6),
      description: d.weather?.[0]?.description ?? "",
    };
  } catch {
    return null;
  }
}

export function buildNotificationPayload(cityName, uv, weather) {
  const level = uvLevel(uv);
  const burn = burnTime(uv);
  const prevent = uvPrevention(uv);
  const icon =
    uv >= 11 ? "🟣" : uv >= 8 ? "🔴" : uv >= 6 ? "🟠" : uv >= 3 ? "🟡" : "🟢";

  const title = `${icon} UV ${uv} in ${cityName} — ${level}`;

  const weatherLine = weather
    ? `🌡 ${weather.temp}° (feels ${weather.feelsLike}°) · 💧 ${weather.humidity}% humidity · 💨 ${weather.windSpeed} km/h`
    : null;

  const burnLine = burn
    ? `⏱ Unprotected skin burns in ~${burn.bare} min · SPF 50 gives ~${burn.prot} min`
    : null;

  const lines = [weatherLine, burnLine, `🧴 ${prevent}`].filter(Boolean);

  const body = lines.join("\n");

  return {
    title,
    body,
    icon: "/icons/icon-192.png",
    url: "/",
    tag: "uvibe-alert",
    urgent: uv >= 8,
  };
}

export async function POST(request) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@uvibe.app",
    process.env.VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || "",
  );
  try {
    const {
      pushToken,
      title,
      body,
      url,
      urgent,
      cityName,
      uv: uvOverride,
    } = await request.json();

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { pushToken } });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.notifEnabled)
      return NextResponse.json(
        { error: "Notifications disabled" },
        { status: 400 },
      );
    if (!user.vapidSubscription)
      return NextResponse.json(
        { error: "No push subscription" },
        { status: 400 },
      );

    let subscription;
    try {
      subscription = JSON.parse(user.vapidSubscription);
    } catch {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 },
      );
    }

    let payload;

    if (cityName && uvOverride !== undefined) {
      const weather = await fetchWeatherForCity(cityName);
      payload = buildNotificationPayload(cityName, uvOverride, weather);
    } else if (title && body) {
      payload = {
        title,
        body,
        icon: "/icons/icon-192.png",
        url: url ?? "/",
        tag: "uvibe-alert",
        urgent: urgent ?? false,
      };
    } else {
      const sub = await prisma.userLocationSubscription.findFirst({
        where: { userId: pushToken, isActive: true },
        include: { location: true },
        orderBy: { subscribedAt: "desc" },
      });
      const city = sub?.location?.locationName ?? "Melbourne";
      const weather = await fetchWeatherForCity(city);
      payload = buildNotificationPayload(city, uvOverride ?? 0, weather);
    }

    await webpush.sendNotification(subscription, JSON.stringify(payload));

    await prisma.notification
      .create({
        data: {
          userId: pushToken,
          subscriptionId: 1,
          uvReadingId: 1,
          notificationType: "uv_alert",
          notificationTitle: payload.title,
          notificationMessage: payload.body,
          deliveryStatus: "delivered",
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const expired = err.statusCode === 410 || err.statusCode === 404;
    if (expired) {
      try {
        const b = await request.json();
        await prisma.user.update({
          where: { pushToken: b.pushToken },
          data: { notifEnabled: false, vapidSubscription: null },
        });
      } catch {}
    }
    return NextResponse.json(
      { error: "Push send failed", detail: err.message, expired },
      { status: 500 },
    );
  }
}
