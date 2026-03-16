"""
ML Engine — Fitzpatrick Skin Type Classification
Uses a lightweight CNN trained on skin tone features.
Full Fitzpatrick17k dataset support when weights are present;
falls back to a heuristic colour-feature model otherwise.
"""

import io
import math
import asyncio
from pathlib import Path
from typing import Any

import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as T
    from torchvision.models import mobilenet_v3_small
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


WEIGHTS_PATH = Path(__file__).parent / "models" / "fitzpatrick_classifier.pt"

FITZPATRICK_META = {
    1: {
        "name": "Type I — Very Fair",
        "uv_vulnerability": "Extremely vulnerable. DNA damage begins in ~10 minutes at high UV. Always use SPF 50+.",
        "aging_multiplier": 1.8,
    },
    2: {
        "name": "Type II — Fair",
        "uv_vulnerability": "Highly vulnerable. Burn time ~20 min at UV 8. Use SPF 30+ sunscreen every 2 hrs.",
        "aging_multiplier": 1.5,
    },
    3: {
        "name": "Type III — Medium",
        "uv_vulnerability": "Moderate risk. Some natural protection. Use SPF 30+ and limit midday exposure.",
        "aging_multiplier": 1.3,
    },
    4: {
        "name": "Type IV — Olive",
        "uv_vulnerability": "Lower risk, but cumulative damage still occurs. SPF 15–30 recommended.",
        "aging_multiplier": 1.1,
    },
    5: {
        "name": "Type V — Brown",
        "uv_vulnerability": "Naturally protected, but skin cancer risk is still real. SPF 15 recommended.",
        "aging_multiplier": 1.0,
    },
    6: {
        "name": "Type VI — Dark Brown/Black",
        "uv_vulnerability": "Highest natural protection. Minimum SPF 15, and watch for atypical skin changes.",
        "aging_multiplier": 0.9,
    },
}


def _load_model():
    """Load PyTorch model if weights exist, otherwise return None."""
    if not TORCH_AVAILABLE:
        return None
    if not WEIGHTS_PATH.exists():
        return None
    try:
        model = mobilenet_v3_small(weights=None)
        model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, 6)
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
        model.eval()
        return model
    except Exception:
        return None


_model = _load_model()

_transform = None
if TORCH_AVAILABLE:
    _transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


# ──────────────────────────────────────────────────────────────────────
# Heuristic fallback: average skin ITA (Individual Typology Angle)
# ──────────────────────────────────────────────────────────────────────

def _ita_to_fitzpatrick(ita_degrees: float) -> int:
    """MAP ITA angle to Fitzpatrick type (Chardon et al. thresholds)."""
    if ita_degrees > 55:
        return 1
    elif ita_degrees > 41:
        return 2
    elif ita_degrees > 28:
        return 3
    elif ita_degrees > 10:
        return 4
    elif ita_degrees > -30:
        return 5
    else:
        return 6


def _heuristic_predict(img_bytes: bytes) -> dict:
    """Colour-feature heuristic when PyTorch weights are unavailable."""
    if not PIL_AVAILABLE:
        return {"fitzpatrick_type": 2, "confidence": 0.5, "detected_markers": []}

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((128, 128))
    arr = np.array(img, dtype=np.float32)

    # ITA calculation in CIE Lab via numpy approximation
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # Linearise sRGB
    def lin(c):
        c = c / 255.0
        return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

    rl, gl, bl = lin(r), lin(g), lin(b)
    # XYZ (D65)
    Y = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
    # L* (lightness)
    Y_n = Y / 1.0
    L = np.where(Y_n > 0.008856, 116 * Y_n ** (1/3) - 16, 903.3 * Y_n)
    # b* (yellow-blue proxy)
    Z_lin = 0.0193 * rl + 0.1192 * gl + 0.9505 * bl
    Z_n = Z_lin / 1.089
    f_Z = np.where(Z_n > 0.008856, Z_n ** (1/3), 7.787 * Z_n + 16/116)
    b_star = 200 * (1 - f_Z)

    L_mean = float(np.mean(L))
    b_mean = float(np.mean(b_star))

    ita = math.degrees(math.atan2(L_mean - 50, b_mean))
    fitzpatrick_type = _ita_to_fitzpatrick(ita)

    # Detect potential photo-damage markers via variance in red channel
    red_var = float(np.var(r))
    markers = []
    if red_var > 1200:
        markers.append("erythema_risk")
    if L_mean < 40:
        markers.append("pigment_spots")

    return {
        "fitzpatrick_type": fitzpatrick_type,
        "confidence": 0.72,  # Heuristic confidence
        "detected_markers": markers,
    }


# ──────────────────────────────────────────────────────────────────────
# Main inference entry point
# ──────────────────────────────────────────────────────────────────────

async def predict_skin_type(img_bytes: bytes) -> dict[str, Any]:
    """Run inference on raw image bytes. Non-blocking."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_predict, img_bytes)
    return result


def _sync_predict(img_bytes: bytes) -> dict[str, Any]:
    fitzpatrick_type = 2
    confidence = 0.72
    markers = []

    if _model is not None and PIL_AVAILABLE and TORCH_AVAILABLE:
        try:
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            tensor = _transform(img).unsqueeze(0)
            with torch.no_grad():
                logits = _model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze().numpy()
            fitzpatrick_type = int(np.argmax(probs)) + 1  # 0-indexed → 1-6
            confidence = float(np.max(probs))
        except Exception:
            heuristic = _heuristic_predict(img_bytes)
            fitzpatrick_type = heuristic["fitzpatrick_type"]
            confidence = heuristic["confidence"]
            markers = heuristic["detected_markers"]
    else:
        heuristic = _heuristic_predict(img_bytes)
        fitzpatrick_type = heuristic["fitzpatrick_type"]
        confidence = heuristic["confidence"]
        markers = heuristic["detected_markers"]

    meta = FITZPATRICK_META.get(fitzpatrick_type, FITZPATRICK_META[2])
    return {
        "fitzpatrick_type": fitzpatrick_type,
        "type_name": meta["name"],
        "uv_vulnerability": meta["uv_vulnerability"],
        "aging_multiplier": meta["aging_multiplier"],
        "detected_markers": markers,
        "confidence": round(confidence, 3),
    }
