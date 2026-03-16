import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      pushToken,
      displayName,
      skinType,
      spfPreference,
      notifEnabled,
      reminderTime,
      ageGroup,
    } = body;

    if (!pushToken)
      return NextResponse.json(
        { error: "pushToken required" },
        { status: 400 },
      );

    const user = await prisma.user.upsert({
      where: { pushToken },
      update: {
        ...(skinType !== undefined && { skinType }),
        ...(spfPreference !== undefined && { spfPreference }),
        ...(notifEnabled !== undefined && { notifEnabled }),
        ...(reminderTime !== undefined && { reminderTime }),
        ...(displayName !== undefined && { displayName }),
        ...(ageGroup !== undefined && { ageGroup }),
        updatedAt: new Date(),
      },
      create: {
        pushToken,
        displayName: displayName ?? null,
        ageGroup: ageGroup ?? null,
        skinType: skinType ?? "III",
        spfPreference: spfPreference ?? 50,
        notifEnabled: notifEnabled ?? true,
        reminderTime: reminderTime ?? null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pushToken = searchParams.get("pushToken");

    if (!pushToken)
      return NextResponse.json(
        { error: "pushToken required" },
        { status: 400 },
      );

    const user = await prisma.user.findUnique({ where: { pushToken } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
