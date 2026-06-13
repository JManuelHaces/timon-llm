# Eval harness (rol C)

Harness de evaluación de tono. Meta SMART: ≥ 80% de aciertos.

- `dataset.example.jsonl` — ejemplo del formato (prompt + knobs + expected_tone).
- `run_eval.py` — runner (stub). Ver docstring para el flujo a implementar.

```bash
uv run python -m eval.run_eval --dataset engine/eval/dataset.example.jsonl
```
