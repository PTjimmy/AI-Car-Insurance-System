# AI Model Weights

## Where to place the model file

Place your trained model file here:

```
Backend/ai_model/best_model.pth
```

## How to obtain the weights

The model is a **ViT-B/16** (Vision Transformer Base, patch size 16) fine-tuned for
vehicle damage severity classification with **3 output classes**:

| Index | Class label  | Display label |
|-------|-------------|---------------|
| 0     | `01-minor`  | Minor         |
| 1     | `02-moderate` | Moderate    |
| 2     | `03-severe` | Severe        |

### Steps

1. Open `AI-ML/severity_of_vehicles_damage_using_ViT.ipynb` in Google Colab.
2. Run all cells. The notebook trains the model and saves weights to `best_model.pth`
   in the Colab runtime (`/content/best_model.pth`).
3. Download the file from Colab:
   ```python
   from google.colab import files
   files.download('best_model.pth')
   ```
4. Place the downloaded file at `Backend/ai_model/best_model.pth`.
5. Confirm the path in your `Backend/.env` file:
   ```
   MODEL_PATH=ai_model/best_model.pth
   ```

## What happens without the weights

If `best_model.pth` is not present, the backend will start normally but the
AI inference endpoint will return an HTTP 503 response explaining that the
model weights are not loaded. All other backend functionality (auth, claims,
officers, admin) continues to work.
