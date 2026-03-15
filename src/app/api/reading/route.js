import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UV_RISK_SEEDS = [
  {
    categoryName: "Low",
    minUv: 0,
    maxUv: 2.9,
    healthAdvice: "No protection needed.",
    colourHex: "#22d3aa",
  },
  {
    categoryName: "Moderate",
    minUv: 3,
    maxUv: 5.9,
    healthAdvice: "Wear SPF 30+.",
    colourHex: "#f59e0b",
  },
  {
    categoryName: "High",
    minUv: 6,
    maxUv: 7.9,
    healthAdvice: "SPF 50+ essential.",
    colourHex: "#f97316",
  },
  {
    categoryName: "Very High",
    minUv: 8,
    maxUv: 10.9,
    healthAdvice: "Avoid peak hours.",
    colourHex: "#ef4444",
  },
  {
    categoryName: "Extreme",
    minUv: 11,
    maxUv: 99,
    healthAdvice: "Stay indoors.",
    colourHex: "#c026d3",
  },
];

async function getRiskCategoryId(uvIndex) {
  const seed =
    UV_RISK_SEEDS.find((r) => uvIndex >= r.minUv && uvIndex <= r.maxUv) ??
    UV_RISK_SEEDS[0];

  const category = await prisma.uvRiskCategory.upsert({
    where: { categoryName: seed.categoryName },
    update: {},
    create: {
      categoryName: seed.categoryName,
      minUv: seed.minUv,
      maxUv: seed.maxUv,
      healthAdvice: seed.healthAdvice,
      colourHex: seed.colourHex,
    },
  });

  return category.riskCategoryId;
}

export async function POST(request) {
  try {
    const { locationName, uvIndex, dataSource } = await request.json();

    if (!locationName || uvIndex === undefined) {
      return NextResponse.json(
        { error: "locationName and uvIndex required" },
        { status: 400 },
      );
    }

    const location = await prisma.location.findFirst({
      where: { locationName },
    });
    if (!location)
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );

    const riskCategoryId = await getRiskCategoryId(uvIndex);

    const reading = await prisma.uvReading.create({
      data: {
        locationId: location.locationId,
        riskCategoryId,
        uvIndex,
        readingDatetime: new Date(),
        dataSource: dataSource ?? "arpansa",
      },
    });

    return NextResponse.json({ success: true, reading });
  } catch {
    return NextResponse.json(
      { error: "Failed to save reading" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get("locationName");
    const limit = parseInt(searchParams.get("limit") ?? "24");

    if (!locationName)
      return NextResponse.json(
        { error: "locationName required" },
        { status: 400 },
      );

    const location = await prisma.location.findFirst({
      where: { locationName },
    });
    if (!location) return NextResponse.json([], { status: 200 });

    const readings = await prisma.uvReading.findMany({
      where: { locationId: location.locationId },
      orderBy: { readingDatetime: "desc" },
      take: limit,
      include: { riskCategory: true },
    });

    return NextResponse.json(readings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch readings" },
      { status: 500 },
    );
  }
}
