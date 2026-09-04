# AI Model Weights — best_model.pth

## Status

`best_model.pth` is **intentionally excluded from Git** (listed in `.gitignore`).
You must train the model yourself using the notebook and place the weights here.

---

## Model details

| Property | Value |
|---|---|
| Architecture | ViT-B/16 (Vision Transformer Base, patch size 16) |
| Source | `torchvision.models.vit_b_16` |
| Fine-tuned head | Linear(768→64)→ReLU→Dropout(0.4)→Linear(64→32)→ReLU→Dropout(0.3)→Linear(32→3) |
| Classes | 3 (Minor / Moderate / Severe) |
| Class mapping | `{'01-minor': 0, '02-moderate': 1, '03-severe': 2}` |
| Input size | 224 × 224 |
| Preprocessing | Resize(224,224) → ToTensor → Normalize(ImageNet mean/std) |
| Dataset | prajwalbhamere/car-damage-severity-dataset (Kaggle) |
| Validation accuracy | 72.98 % (epoch 45 / early stopping patience=15) |
| Checkpoint filename | `best_model.pth` (saved by `torch.save(model.state_dict(), ...)`) |

---

## Step 1 — Train the model in Google Colab

1. Open **Google Colab**: https://colab.research.google.com/
2. Upload or open the notebook:
   `AI-ML/severity_of_vehicles_damage_using_ViT.ipynb`
3. In Colab, go to **Runtime → Change runtime type** and select **GPU** (T4 or better).
4. Run **all cells from top to bottom** (Runtime → Run all).
   - Cell 0 downloads the dataset from Kaggle via `kagglehub`.
   - Cells 12–23 train the ViT-B/16 model for up to 50 epochs with early stopping.
   - The best weights are saved automatically to `/content/best_model.pth` on the Colab runtime.
   - Training takes approximately 20–40 minutes on a T4 GPU.
5. Confirm training finished — look for output like:
   ```
   Early Stopping Triggered
   Validation Accuracy : 72.98%
   <All keys matched successfully>
   ```

---

## Step 2 — Download best_model.pth from Colab

After training completes, run this in a new Colab cell:

```python
from google.colab import files
files.download('/content/best_model.pth')
```

Your browser will download `best_model.pth` (approximately 330 MB).

---

## Step 3 — Place the weights in the backend

Place the downloaded file at exactly this path:

```
AI-Car-Insurance-System/
└── Backend/
    └── ai_model/
        └── best_model.pth   ← place it here
```

```bash
# From the project root:
cp ~/Downloads/best_model.pth "Backend/ai_model/best_model.pth"
```

---

## Step 4 — Confirm MODEL_PATH in .env

Open `Backend/.env` and confirm this line is present and correct:

```env
MODEL_PATH=ai_model/best_model.pth
```

The path is relative to the `Backend/` directory (where uvicorn runs).

---

## Step 5 — Restart the FastAPI server

```bash
cd Backend
source .venv/bin/activate
uvicorn app.main:app --port 8000
```

Watch the startup output. You should see:

```
INFO:app.services.ai_inference:Loading ViT-B/16 model from ai_model/best_model.pth on cpu
INFO:app.services.ai_inference:ViT-B/16 model loaded. Val accuracy from training: 72.98%
INFO:     Application startup complete.
```

Instead of the previous warning:

```
WARNING: AI model NOT loaded: Model weights not found at '...'
```

---

## Step 6 — Verify ai_model_loaded = true

```bash
curl http://localhost:8000/
```

Expected response when loaded:

```json
{
  "status": "ok",
  "service": "InsureAI API",
  "version": "1.0.0",
  "ai_model_loaded": true
}
```

---

## What happens without the weights

If `best_model.pth` is absent:
- The backend starts normally — all auth, claim, officer, and admin endpoints work.
- Image uploads are saved to disk.
- `ai_analysis.damage_severity` and `confidence_score` remain `null`.
- `ai_analysis.estimated_claim_amount` and `coverage_pct_applied` remain `null`.
- The officer can still review the claim and make a decision manually.

---

## What the model does (and does not do)

| What ViT does | What ViT does NOT do |
|---|---|
| Classifies damage as Minor / Moderate / Severe | Predict repair cost |
| Returns a confidence score (0.0–1.0) | Approve or reject claims |
| Runs on the first uploaded damage image | Analyse multiple images (Option B) |

Repair cost, coverage percentage, deductible, and estimated claim amount are
calculated by `Backend/app/services/claim_estimator.py` using policy rules
from PostgreSQL — not by the ViT model.
