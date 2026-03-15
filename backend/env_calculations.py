"""
Environmental Calculations
  - WBGT (Wet Bulb Globe Temperature) via Liljegren approximation
  - Live Sweat Loss estimation (mL/hr)
"""

import math


def calculate_wbgt(
    air_temp_c: float,
    relative_humidity: float,   # 0-100
    wind_speed_ms: float,
) -> float:
    """
    Simplified WBGT using the Steadman / Bernard approximation.
    WBGT = 0.7 * Twb + 0.2 * Tg + 0.1 * Ta
    where:
      Twb ≈ Ta * atan(0.151977 * (RH + 8.313659)^0.5) + atan(Ta + RH)
            - atan(RH - 1.676331) + 0.00391838 * RH^1.5
            * atan(0.023101 * RH) - 4.686035     (Stull 2011)
      Tg  ≈ Ta + 8 - 5 * wind_speed_ms^0.7      (globe sensor proxy)
    """
    # Wet bulb temperature (Stull 2011 empirical formula)
    rh = relative_humidity
    ta = air_temp_c
    twb = (
        ta * math.atan(0.151977 * (rh + 8.313659) ** 0.5)
        + math.atan(ta + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * rh ** 1.5 * math.atan(0.023101 * rh)
        - 4.686035
    )
    # Globe temperature proxy
    tg = ta + 8 - 5 * (max(wind_speed_ms, 0.1) ** 0.7)
    wbgt = 0.7 * twb + 0.2 * tg + 0.1 * ta
    return wbgt


def calculate_sweat_loss(wbgt: float, weight_kg: float = 75.0) -> float:
    """
    Estimate sweat loss in mL/hr using metabolic heat and evaporative efficiency.
    
    Formula overview:
      Base Metabolic Rate  (BMR) ≈ weight_kg * 1.1  W  (sedentary adult proxy)
      Heat Gain from environment  ≈ 15 * (WBGT - 28) W  when WBGT > 28, else 0
      Evaporation efficiency ≈ 0.84  (skin/clothing factor)
      Sweat latent heat ≈ 2426 J/g at 36°C body temp
      
      sweat_g_hr = (BMR + heat_gain) / evap_efficiency / (2426/3600)
      sweat_ml_hr ≈ sweat_g_hr (density ≈ 1 g/mL)
    """
    bmr_w = weight_kg * 1.1
    heat_gain = max(0.0, 15 * (wbgt - 28))
    total_w = bmr_w + heat_gain
    evap_efficiency = 0.84
    latent_heat_w_per_g_per_hr = 2426 / 3600  # J/g → W per (g/hr)
    sweat_g_hr = total_w / evap_efficiency / latent_heat_w_per_g_per_hr
    return max(0.0, sweat_g_hr)
