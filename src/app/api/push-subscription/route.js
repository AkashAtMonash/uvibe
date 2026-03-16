import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { pushToken, subscription } = await request.json();

    if (!pushToken || !subscription?.endpoint) {
      return NextResponse.json(
        { error: "pushToken and subscription required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { pushToken } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { pushToken },
      data: { vapidSubscription: JSON.stringify(subscription) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save subscription", detail: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { pushToken } = await request.json();

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken required" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { pushToken },
      data: { notifEnabled: false, vapidSubscription: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to remove subscription", detail: err.message },
      { status: 500 },
    );
  }
}
