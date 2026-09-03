"""
AI Inference Service — ViT-B/16 Vehicle Damage Severity Classifier
===================================================================

Source of truth: AI-ML/severity_of_vehicles_damage_using_ViT.ipynb

Model architecture (matches notebook exactly):
  - Base:   vit_b_16 (ViT_B_16_Weights.DEFAULT)
  - Head:   Linear(768→64) → ReLU → Dropout(0.4)
              → Linear(64→32) → ReLU → Dropout(0.3)
              → Linear(32→3)
  - Frozen: all layers except heads

Training details (from notebook outputs):
  - Dataset:  prajwalbhamere/car-damage-severity-dataset
  - Classes:  01-minor (0), 02-moderate (1), 03-severe (2)
  - Epochs:   50 (early stopping at epoch 45, patience=15)
  - Val accuracy: 72.98%
  - Checkpoint: best_model.pth

Preprocessing (matches val_transform in notebook):
  - Resize to 224×224
  - ToTensor
  - Normalize with ImageNet mean/std (via ViT_B_16_Weights.DEFAULT.transforms())

Class mapping (verified from notebook cell 6 output):
  {'01-minor': 0, '02-moderate': 1, '03-severe': 2}
  → Display labels: 0→Minor, 1→Moderate, 2→Severe

What predict() returns:
  - damage_severity (str):    "Minor" | "Moderate" | "Severe"   ← AI prediction
  - confidence_score (float): 0.0–1.0                           ← AI prediction
  - model_version (str):      "vit-b16-v1"

What predict() does NOT return:
  - estimated_repair_cost  — not predicted by ViT; derived from
                             customer-submitted claimed_amount (Option B)
  - risk_level             — removed; no documented business rule retained
  - fraud_score            — no fraud model exists; field removed from output

Claim calculation (coverage %, deductible, max_claim) is performed by
claim_estimator.py, not here.

Multi-image strategy — Option B (documented):
  The FIRST uploaded image for a claim is analysed by this service.
  Subsequent images are stored as supporting evidence in the claim_image
  table but are NOT re-analysed. There is exactly one ai_analysis row
  per claim. The calling code (customer.py) enforces this.

Model weights location:
  Backend/ai_model/best_model.pth
  Configure via MODEL_PATH in .env

If weights are absent the service raises ModelNotLoadedError.
The backend catches this and returns HTTP 503; all other endpoints
continue to work.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_torch_available = False
try:
    import torch
    import torch.nn as nn
    from torchvision.models import ViT_B_16_Weights, vit_b_16
    from PIL import Image

    _torch_available = True
except ImportError:
    logger.warning(
        "PyTorch / torchvision / Pillow not installed. "
        "AI inference will be unavailable until requirements.txt is installed."
    )

# ---------------------------------------------------------------------------
# Class mapping — verified against notebook cell 6 output
# {'01-minor': 0, '02-moderate': 1, '03-severe': 2}
# ---------------------------------------------------------------------------
CLASS_LABELS: dict[int, str] = {
    0: "Minor",
    1: "Moderate",
    2: "Severe",
}

NUM_CLASSES = 3
MODEL_VERSION = "vit-b16-v1"


class ModelNotLoadedError(RuntimeError):
    """Raised when the model weights file is not present or torch unavailable."""
    pass


class AIInferenceService:
    """
    Singleton service that loads the ViT-B/16 model once at startup
    and exposes predict() for single-image severity classification.
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

    def load(self, model_path: "str | Path") -> None:
        """
        Load model weights. Call once at application startup (main.py lifespan).
        Raises ModelNotLoadedError if torch is unavailable or the file is missing.
        """
        if not _torch_available:
            raise ModelNotLoadedError(
                "PyTorch is not installed. Run: pip install -r requirements.txt"
            )

        path = Path(model_path)
        if not path.exists():
            raise ModelNotLoadedError(
                f"Model weights not found at '{path.resolve()}'. "
                f"See Backend/ai_model/README.md for instructions."
            )

        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Loading ViT-B/16 model from %s on %s", path, self._device)

        # Build architecture exactly matching the notebook (cells 17–18)
        weights = ViT_B_16_Weights.DEFAULT
        model = vit_b_16(weights=None)          # no pretrained weights; load ours

        in_features = model.heads[0].in_features  # 768 for ViT-B/16
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

        # Preprocessing pipeline matching val_transform in notebook (cell 12):
        # Resize(224,224) → ToTensor → Normalize(ImageNet mean/std)
        # ViT_B_16_Weights.DEFAULT.transforms() produces exactly this.
        self._transform = weights.transforms()

        self._loaded = True
        logger.info("ViT-B/16 model loaded. Val accuracy from training: 72.98%%")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, image_path: "str | Path") -> dict:
        """
        Classify vehicle damage severity from a single image.

        Parameters
        ----------
        image_path : str or Path
            Path to the image file (JPG, PNG, or WebP).

        Returns
        -------
        dict with keys:
            damage_severity  (str)   — "Minor" | "Moderate" | "Severe"
            confidence_score (float) — softmax probability 0.0–1.0
            model_version    (str)   — "vit-b16-v1"

        The returned dict contains ONLY AI prediction outputs.
        Claim calculation (coverage %, deductible, estimated_claim_amount)
        is performed separately by claim_estimator.py.

        Raises
        ------
        ModelNotLoadedError  — if load() was not called or weights missing.
        FileNotFoundError    — if image_path does not exist.
        """
        if not self._loaded:
            raise ModelNotLoadedError(
                "Model is not loaded. Place best_model.pth in Backend/ai_model/ "
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
        conf = round(float(confidence.item()), 4)

        return {
            "damage_severity": severity,   # AI prediction — ViT classification
            "confidence_score": conf,      # AI prediction — softmax probability
            "model_version": MODEL_VERSION,
        }


# Module-level singleton used by customer.py and other routes
inference_service = AIInferenceService()
