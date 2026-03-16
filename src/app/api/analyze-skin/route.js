import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/api/ml/analyze-skin`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Backend error");
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[analyze-skin proxy]", err);
    return NextResponse.json(
      { error: "Backend unreachable. Is the service running?" },
      { status: 502 }
    );
  }
}
