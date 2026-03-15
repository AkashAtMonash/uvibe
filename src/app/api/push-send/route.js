import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request) {
  try {
    const { pushToken, title, body, url, urgent } = await request.json();

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { pushToken } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.notifEnabled) {
      return NextResponse.json(
        { error: "Notifications disabled" },
        { status: 400 },
      );
    }
    if (!user.vapidSubscription) {
      return NextResponse.json(
        { error: "No push subscription" },
        { status: 400 },
      );
    }

    let subscription;
    try {
      subscription = JSON.parse(user.vapidSubscription);
    } catch {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 },
      );
    }

    const payload = JSON.stringify({
      title: title ?? "☀ UVibe UV Alert",
      body: body ?? "UV levels are dangerous. Apply SPF 50+ now.",
      icon: "/icons/icon-256.png",
      url: url ?? "/",
      urgent: urgent ?? false,
      tag: "uvibe-alert",
    });

    await webpush.sendNotification(subscription, payload);

    await prisma.notification
      .create({
        data: {
          userId: pushToken,
          subscriptionId: 1,
          uvReadingId: 1,
          notificationType: "uv_alert",
          notificationTitle: title ?? "UV Alert",
          notificationMessage: body ?? "",
          deliveryStatus: "delivered",
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const expired = err.statusCode === 410 || err.statusCode === 404;

    if (expired) {
      const body = await request.json().catch(() => ({}));
      await prisma.user
        .update({
          where: { pushToken: body.pushToken },
          data: { notifEnabled: false, vapidSubscription: null },
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { error: "Push send failed", detail: err.message, expired },
      { status: 500 },
    );
  }
}
