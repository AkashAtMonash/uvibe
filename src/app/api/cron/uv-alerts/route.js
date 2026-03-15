import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const UV_LEVEL_LABEL = (uv) =>
  uv >= 11
    ? "Extreme"
    : uv >= 8
      ? "Very High"
      : uv >= 6
        ? "High"
        : uv >= 3
          ? "Moderate"
          : "Low";

const UV_ADVICE = (uv) =>
  uv >= 11
    ? "Stay indoors. Unprotected skin burns in minutes."
    : uv >= 8
      ? "Avoid being outside. Apply SPF 50+ and cover up."
      : uv >= 6
        ? "SPF 50+ essential. Wear hat and sunglasses."
        : "Wear SPF 30+ if outside for more than 30 minutes.";

async function fetchUVForCity(arpansaId) {
  const res = await fetch("https://uvdata.arpansa.gov.au/xml/uvvalues.xml", {
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const data = parser.parse(xml);
  const match = (data?.stations?.location ?? []).find(
    (s) => s.id?.toLowerCase() === arpansaId.toLowerCase(),
  );
  return match ? parseFloat(match.index ?? 0) : null;
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

  const CITY_ARPANSA = {
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

  try {
    const subscriptions = await prisma.userLocationSubscription.findMany({
      where: {
        isActive: true,
        user: { notifEnabled: true, reminderTime: { not: null } },
      },
      include: { user: true, location: true },
    });

    const results = { sent: 0, skipped: 0, errors: 0 };

    // Group by location to avoid fetching the same UV data multiple times
    const byCity = {};
    for (const sub of subscriptions) {
      const city = sub.location.locationName;
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push(sub);
    }

    for (const [city, subs] of Object.entries(byCity)) {
      const arpansaId = CITY_ARPANSA[city];
      if (!arpansaId) continue;

      const uv = await fetchUVForCity(arpansaId);
      if (uv === null) continue;

      for (const sub of subs) {
        const threshold = sub.user.alertThreshold ?? 6;
        if (uv < threshold) {
          results.skipped++;
          continue;
        }

        let pushSub;
        try {
          pushSub = JSON.parse(sub.user.reminderTime);
        } catch {
          continue;
        }

        const title = `☀ UV ${uv} in ${city} — ${UV_LEVEL_LABEL(uv)}`;
        const body = UV_ADVICE(uv);
        const payload = JSON.stringify({
          title,
          body,
          icon: "/icons/icon-256.png",
          url: "/",
          tag: "uvibe-alert",
        });

        try {
          await webpush.sendNotification(pushSub, payload);

          // Log notification
          await prisma.notification
            .create({
              data: {
                userId: sub.user.pushToken,
                subscriptionId: sub.subscriptionId,
                uvReadingId: 1,
                notificationType: "uv_alert",
                notificationTitle: title,
                notificationMessage: body,
                deliveryStatus: "delivered",
              },
            })
            .catch(() => {});

          results.sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired — clean up
            await prisma.user
              .update({
                where: { pushToken: sub.user.pushToken },
                data: { notifEnabled: false, reminderTime: null },
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
