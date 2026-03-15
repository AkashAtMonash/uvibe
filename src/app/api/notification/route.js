import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { pushToken, subscriptionId, uvReadingId, type, title, message } =
      await request.json();

    if (!pushToken || !subscriptionId || !uvReadingId) {
      return NextResponse.json(
        { error: "pushToken, subscriptionId, uvReadingId required" },
        { status: 400 },
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: pushToken,
        subscriptionId,
        uvReadingId,
        notificationType: type ?? "uv_alert",
        notificationTitle: title ?? "UV Alert",
        notificationMessage: message ?? "",
        deliveryStatus: "pending",
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch {
    return NextResponse.json(
      { error: "Failed to log notification" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { notificationId, deliveryStatus } = await request.json();
    if (!notificationId)
      return NextResponse.json(
        { error: "notificationId required" },
        { status: 400 },
      );

    const updated = await prisma.notification.update({
      where: { notificationId },
      data: { deliveryStatus: deliveryStatus ?? "delivered" },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
