"""
AI Inference Service — ViT-B/16 Vehicle Damage Severity Classifier

Architecture mirrors the training notebook exactly:
  AI-ML/severity_of_vehicles_damage_using_ViT.ipynb

Class mapping (from notebook output):
  {'01-minor': 0, '02-moderate': 1, '03-severe': 2}

Display labels:
  0 → Minor
  1 → Moderate
  2 → Severe

Model weights file location:
  Backend/ai_model/best_model.pth
  (configure via MODEL_PATH in .env)

If the weights file is absent the service raises ModelNotLoadedError.
The backend catches this and returns HTTP 503 with a clear message.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy imports so the backend starts even if torch is not installed yet
_torch_available = False
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms
    from torchvision.models import ViT_B_16_Weights, vit_b_16
    from PIL import Image

    _torch_available = True
except ImportError:
    logger.warning(
        "PyTorch / torchvision / Pillow not installed. "
        "AI inference will be unavailable."
    )


# ---------------------------------------------------------------------------
# Class mapping — must match the training notebook exactly
# ---------------------------------------------------------------------------

CLASS_LABELS = {
    0: "Minor",
    1: "Moderate",
    2: "Severe",
}

# Risk level mapping derived from severity
RISK_LEVEL_MAP = {
    "Minor": "Low",
    "Moderate": "Medium",
    "Severe": "High",
}

# Rough repair cost estimates (INR) used when no separate model provides cost
REPAIR_COST_ESTIMATE = {
    "Minor": 25000.0,
    "Moderate": 75000.0,
    "Severe": 200000.0,
}

NUM_CLASSES = 3
MODEL_VERSION = "vit-b16-v1"


class ModelNotLoadedError(RuntimeError):
    """Raised when the model weights file is not present."""
    pass


class AIInferenceService:
    """
    Singleton service that loads the ViT-B/16 model once and exposes
    a predict() method for single-image inference.
    """

    _instance: Optional["AIInferenceService"] = None
    _model = None
    _transform = None
    _device = None
    _loaded: bool = False

    def __new__(cls) -> "AIInferenceService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self, model_path: str | Path) -> None:
        """
        Load model weights from model_path.
        Call this once at application startup (see main.py lifespan).
        """
        if not _torch_available:
            raise ModelNotLoadedError(
                "PyTorch is not installed. Install requirements.txt dependencies."
            )

        path = Path(model_path)
        if not path.exists():
            raise ModelNotLoadedError(
                f"Model weights not found at '{path.resolve()}'. "
                f"See Backend/ai_model/README.md for instructions on obtaining best_model.pth."
            )

        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Loading ViT-B/16 model from %s on %s", path, self._device)

        # --- Build the exact same architecture as the notebook ---
        weights = ViT_B_16_Weights.DEFAULT
        model = vit_b_16(weights=None)  # no pretrained weights; we load our own

        in_features = model.heads[0].in_features
        model.heads = nn.Sequential(
            nn.Linear(in_features, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(64, 32),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(32, NUM_CLASSES),
        )

        state = torch.load(path, map_location=self._device, weights_only=True)
        model.load_state_dict(state)
        model.to(self._device)
        model.eval()

        self._model = model

        # --- Preprocessing pipeline matching ViT_B_16_Weights.DEFAULT ---
        self._transform = weights.transforms()

        self._loaded = True
        logger.info("ViT-B/16 model loaded successfully.")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, image_path: str | Path) -> dict:
        """
        Run inference on a single image file.

        Returns a dict with:
            damage_severity (str):       "Minor" | "Moderate" | "Severe"
            confidence_score (float):    0.0 – 1.0
            estimated_repair_cost (float): INR estimate
            risk_level (str):            "Low" | "Medium" | "High"
            fraud_score (float):         placeholder 0.0 (not modelled)
            model_version (str):         "vit-b16-v1"
        """
        if not self._loaded:
            raise ModelNotLoadedError(
                "Model is not loaded. Place best_model.pth at Backend/ai_model/ "
                "and restart the server."
            )

        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        img = Image.open(image_path).convert("RGB")
        tensor = self._transform(img).unsqueeze(0).to(self._device)

        with torch.no_grad():
            logits = self._model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, predicted_idx = torch.max(probs, dim=1)

        label_idx = int(predicted_idx.item())
        severity = CLASS_LABELS[label_idx]
        conf = float(confidence.item())

        return {
            "damage_severity": severity,
            "confidence_score": round(conf, 4),
            "estimated_repair_cost": REPAIR_COST_ESTIMATE[severity],
            "risk_level": RISK_LEVEL_MAP[severity],
            "fraud_score": 0.0,
            "model_version": MODEL_VERSION,
        }


# Module-level singleton
inference_service = AIInferenceService()
