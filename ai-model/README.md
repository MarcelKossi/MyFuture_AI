# AI Model (reserved)

This folder is **reserved** for MyFuture AI (training, inference, versioning).

## Status

- Current: **empty** (stub to come).
- Goal: fully isolate AI from the rest of the system with stable contracts.

## Recommended structure (to be created incrementally)

- `training/`: offline training pipeline (datasets, features, eval)
- `inference/`: inference code/service (prediction + explainability)
- `registry/`: storage/versioning for model artifacts

## Expected contract (high level)

Typical inputs: level, grades (subject + grade + scale), aspiration.
Typical outputs: average, recommendations (score + explanations), model version.

## Related docs

- Target AI contract: `my-future-vision/docs/cahier-des-charges.md`
