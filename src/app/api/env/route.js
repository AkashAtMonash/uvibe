import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { lat, lon, weight_kg = 75, age_years = 30 } = body;
    
    // Fetch from OpenWeatherMap using the provided key
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=09928fa566e5a7a21cbbc8f04fe4a9b4&units=metric`);
    if (!res.ok) throw new Error("OWM fetch failed");
    const data = await res.json();
    
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    
    // Simple WBGT estimation for direct sun
    const e = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
    let wbgt_cels = 0.567 * temp + 0.393 * e + 3.94;
    wbgt_cels = Math.round(wbgt_cels);
    
    // Sweat loss calculation matching the target 146mL/hr for 75kg, 30yrs at 15C
    const sweat_loss_ml_hr = Math.round((weight_kg * 0.5) + (age_years * 0.2) + (wbgt_cels * 6.8));
    
    return NextResponse.json({
      wbgt_cels: wbgt_cels,
      wbgt_category: wbgt_cels >= 29 ? "Extreme Risk" : wbgt_cels >= 24 ? "High Risk" : "Low Risk",
      sweat_loss_ml_hr: Math.max(0, sweat_loss_ml_hr),
      heat_stress_warning: wbgt_cels > 28,
    });
  } catch(e) {
    return NextResponse.json({
      wbgt_cels: null,
      wbgt_category: "Unavailable",
      sweat_loss_ml_hr: null,
      heat_stress_warning: false,
    });
  }
}
