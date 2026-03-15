import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getOrCreateLocation(cityName) {
  const CITY_DATA = {
    Melbourne: { latitude: -37.81, longitude: 144.96, state: "VIC" },
    Sydney: { latitude: -33.87, longitude: 151.21, state: "NSW" },
    Brisbane: { latitude: -27.47, longitude: 153.03, state: "QLD" },
    Adelaide: { latitude: -34.93, longitude: 138.6, state: "SA" },
    Perth: { latitude: -31.95, longitude: 115.86, state: "WA" },
    Darwin: { latitude: -12.46, longitude: 130.84, state: "NT" },
    Hobart: { latitude: -42.88, longitude: 147.33, state: "TAS" },
    Canberra: { latitude: -35.28, longitude: 149.13, state: "ACT" },
    Townsville: { latitude: -19.26, longitude: 146.82, state: "QLD" },
    "Alice Springs": { latitude: -23.7, longitude: 133.88, state: "NT" },
    "Gold Coast": { latitude: -28.0, longitude: 153.43, state: "QLD" },
    Newcastle: { latitude: -32.93, longitude: 151.78, state: "NSW" },
    Emerald: { latitude: -23.52, longitude: 148.16, state: "QLD" },
  };

  const coords = CITY_DATA[cityName];

  return prisma.location.upsert({
    where: { locationName: cityName },
    update: {},
    create: {
      locationName: cityName,
      latitude: coords?.latitude ?? 0,
      longitude: coords?.longitude ?? 0,
      state: coords?.state ?? null,
      country: "Australia",
    },
  });
}

export async function POST(request) {
  try {
    const { pushToken, cityName } = await request.json();

    if (!pushToken || !cityName) {
      return NextResponse.json(
        { error: "pushToken and cityName required" },
        { status: 400 },
      );
    }

    const userExists = await prisma.user.findUnique({ where: { pushToken } });
    if (!userExists)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const location = await getOrCreateLocation(cityName);

    await prisma.userLocationSubscription.updateMany({
      where: { userId: pushToken, isActive: true },
      data: { isActive: false },
    });

    const subscription = await prisma.userLocationSubscription.create({
      data: {
        userId: pushToken,
        locationId: location.locationId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, subscription, location });
  } catch {
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
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

    const sub = await prisma.userLocationSubscription.findFirst({
      where: { userId: pushToken, isActive: true },
      include: { location: true },
      orderBy: { subscribedAt: "desc" },
    });

    return NextResponse.json(sub ?? null);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}
