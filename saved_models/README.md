# Saved Models

This directory contains pre-trained `.pkl` model files for all 8 drug categories.

## Naming Convention

Models follow this pattern: `{algorithm}_model_{drug_code}[_no_weather].pkl`

| Prefix | Algorithm | Notes |
|---|---|---|
| `randomforest_model_` | Random Forest | **Current canonical models** — used by `multi_horizon_forecast.py` |
| `knn_model_` | K-Nearest Neighbors | Alternative model family |
| `xgboost_model_` | XGBoost | Alternative model family |

The `_no_weather` suffix indicates a variant trained **without weather features**, for comparison or fallback when weather data is unavailable.

## Drug Codes

`M01AB`, `M01AE`, `N02BA`, `N02BE`, `N05B`, `N05C`, `R03`, `R06`

## Re-Training

```bash
# From project root
python train_model_saperately.py        # With weather features
python train_model_no_weather.py         # Without weather features
```

## Model Selection at Forecast Time

Pass `--model-type` to `main.py`:

```bash
python main.py daily --model-type rf       # Random Forest (default)
python main.py daily --model-type knn      # K-Nearest Neighbors
python main.py daily --model-type xgboost  # XGBoost
```

## Performance Metrics

See `../model_comparison_results.csv` and `../mape_comparison_test_set.csv` for MAPE and other metrics comparing model families.
