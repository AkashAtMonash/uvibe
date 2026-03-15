import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";
import { buildNotificationPayload } from "@/app/api/push-send/route";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const ARPANSA_NAMES = {
  Melbourne: "Melbourne",
  Sydney: "Sydney",
  Brisbane: "Brisbane",
  Adelaide: "Adelaide",
  Perth: "Perth",
  Darwin: "Darwin",
  Hobart: "Kingston",
  Canberra: "Canberra",
  Townsville: "Townsville",
  "Alice Springs": "Alice Springs",
  "Gold Coast": "Gold Coast",
  Newcastle: "Newcastle",
  Emerald: "Emerald",
};

const CITY_COORDS = {
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

async function fetchARPANSA() {
  const res = await fetch("https://uvdata.arpansa.gov.au/xml/uvvalues.xml", {
    cache: "no-store",
  });
  if (!res.ok) return {};
  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const data = parser.parse(xml);
  const map = {};
  for (const s of data?.stations?.location ?? []) {
    map[s.id?.toLowerCase()] = parseFloat(s.index ?? 0);
  }
  return map;
}

async function fetchWeather(city) {
  const c = CITY_COORDS[city];
  if (!c || !process.env.OPENWEATHER_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
      { cache: "no-store" },
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

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isVercel = request.headers.get("x-vercel-signature") != null;
  const isAuthorised =
    !cronSecret || authHeader === `Bearer ${cronSecret}` || isVercel;

  if (!isAuthorised) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const arpansaMap = await fetchARPANSA();

    const subscriptions = await prisma.userLocationSubscription.findMany({
      where: {
        isActive: true,
        user: { notifEnabled: true, vapidSubscription: { not: null } },
      },
      include: { user: true, location: true },
    });

    const results = { sent: 0, skipped: 0, errors: 0 };

    const byCity = {};
    for (const sub of subscriptions) {
      const city = sub.location.locationName;
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push(sub);
    }

    for (const [city, subs] of Object.entries(byCity)) {
      const arpansaId = ARPANSA_NAMES[city]?.toLowerCase();
      const uv = arpansaId ? (arpansaMap[arpansaId] ?? 0) : 0;
      const weather = await fetchWeather(city);

      for (const sub of subs) {
        const threshold = sub.user.alertThreshold ?? 3;
        if (uv < threshold) {
          results.skipped++;
          continue;
        }

        let pushSub;
        try {
          pushSub = JSON.parse(sub.user.vapidSubscription);
        } catch {
          continue;
        }

        const payload = buildNotificationPayload(city, uv, weather);

        try {
          await webpush.sendNotification(pushSub, JSON.stringify(payload));

          await prisma.notification
            .create({
              data: {
                userId: sub.user.pushToken,
                subscriptionId: sub.subscriptionId,
                uvReadingId: 1,
                notificationType: "uv_alert",
                notificationTitle: payload.title,
                notificationMessage: payload.body,
                deliveryStatus: "delivered",
              },
            })
            .catch(() => {});

          results.sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.user
              .update({
                where: { pushToken: sub.user.pushToken },
                data: { notifEnabled: false, vapidSubscription: null },
              })
              .catch(() => {});
          }
          results.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
