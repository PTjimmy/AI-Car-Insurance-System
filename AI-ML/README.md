# AI-ML

This folder contains the machine learning notebook for the
AI-Based Car Insurance Claim Analysis and Damage Assessment System.

---

## Contents

| File | Purpose |
|---|---|
| `severity_of_vehicles_damage_using_ViT.ipynb` | ViT-B/16 training notebook + RAG policy retrieval demo |

---

## What the notebook does

The notebook has two distinct sections:

### Section A — ViT-B/16 Training (Cells 0–28)

Trains a Vision Transformer (ViT-B/16) to classify vehicle damage images
into three severity categories: **Minor**, **Moderate**, **Severe**.

| Property | Value |
|---|---|
| Base model | `torchvision.models.vit_b_16` (ViT_B_16_Weights.DEFAULT) |
| Dataset | `prajwalbhamere/car-damage-severity-dataset` (Kaggle) |
| Training images | 1,383 across 3 classes |
| Validation images | 248 |
| Class mapping | `{'01-minor': 0, '02-moderate': 1, '03-severe': 2}` |
| Epochs | Up to 50 (early stopping, patience=15) |
| Best val accuracy | 72.98 % |
| Output | `best_model.pth` saved to `/content/best_model.pth` on Colab runtime |

**The ViT model predicts damage severity and confidence only.**
It does NOT predict repair cost, coverage percentage, or claim amount.

### Section B — RAG Policy Retrieval Demo (Cells 29–35)

Demonstrates retrieving policy rules from the RAG Policy Knowledge Base PDF
using FAISS vector search and sentence-transformers embeddings.

> **Important:** This RAG section is a **notebook demonstration only**.
> The live web application backend does NOT use FAISS or LangChain.
> See the Architecture section below for the distinction.

---

## How to run in Google Colab

### Prerequisites

- A Google account (for Colab access)
- A Kaggle account (for dataset download in Cell 0)
  - Create `~/.kaggle/kaggle.json` or set `KAGGLE_USERNAME` / `KAGGLE_KEY` environment variables

### Steps

1. Go to https://colab.research.google.com/
2. File → Upload notebook → select `severity_of_vessels_damage_using_ViT.ipynb`
3. Runtime → Change runtime type → **GPU** (T4 or A100 recommended)
4. Runtime → Run all
5. Wait for training to complete (≈ 20–40 min on T4 GPU)
6. Confirm output:
   ```
   Early Stopping Triggered
   Validation Accuracy : 72.98%
   <All keys matched successfully>
   ```

### Obtaining best_model.pth

After training, run in a new Colab cell:

```python
from google.colab import files
files.download('/content/best_model.pth')
```

Place the downloaded file at:
```
Backend/ai_model/best_model.pth
```

See `Backend/ai_model/README.md` for complete deployment instructions.

---

## Running the RAG demo (Section B)

Section B requires the RAG Policy Knowledge Base PDF to be uploaded to Colab:

1. Upload `AI_Insurance_RAG_Policy_Knowledge_Base.pdf` to `/content/` in Colab
2. Run Cells 29–35 after Cell 28 completes

### Repair cost input — Option B

`estimate_claim()` requires `repair_cost` to be provided by the caller.
The ViT model does **not** predict repair cost.
In the notebook demo, pass the test value explicitly:

```python
result = rag_claim_estimator(
    model=model,
    image_path="/content/your_image.jpg",
    policy_id="P003",
    repair_cost=50000.0   # customer claimed amount (Option B)
)
```

If `repair_cost` is `None`, a `ValueError` is raised — there is no midpoint fallback.

---

## Architecture distinction

| | Notebook | Live Web Application |
|---|---|---|
| Damage classification | ViT-B/16 | ViT-B/16 (same model) |
| Policy retrieval | FAISS + LangChain RAG | PostgreSQL `policy_type` table |
| Claim calculation | `estimate_claim()` in notebook | `claim_estimator.py` (deterministic) |
| Repair cost source | Caller-supplied `repair_cost` | Customer's `claimed_amount` (Option B) |
| Dependencies | langchain, faiss-cpu, sentence-transformers | None (uses PostgreSQL only) |

The live backend (`Backend/app/`) does **not** import or use FAISS, LangChain,
or any vector database. All policy rules come from PostgreSQL via
`Backend/app/services/policy_service.py`.

---

## Class mapping (verified from notebook Cell 6 output)

```python
{'01-minor': 0, '02-moderate': 1, '03-severe': 2}
```

Display labels used in the web app:

| Index | Folder name | Display label |
|---|---|---|
| 0 | `01-minor` | Minor |
| 1 | `02-moderate` | Moderate |
| 2 | `03-severe` | Severe |

---

## Note on policy values

The RAG Policy Knowledge Base (P001–P006) contains **synthetic prototype values**
created for an academic/minor-project demonstration.
They are not real insurance products, legal terms, or actual insurer pricing.
