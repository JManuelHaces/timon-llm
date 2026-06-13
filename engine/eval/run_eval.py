"""Runner del harness de tono. ROL C: implementar el juez de tono.

Uso previsto:
    uv run python -m eval.run_eval --dataset engine/eval/dataset.example.jsonl

Flujo (a implementar):
1. Cargar el dataset (.jsonl): prompt + knobs + expected_tone.
2. Para cada fila, generar con el motor (mock o Gemma).
3. Juzgar el tono de la salida vs expected_tone (LLM-juez o clasificador).
4. Reportar accuracy global; objetivo ≥ 0.80.
"""

import argparse
import json
from pathlib import Path


def load_dataset(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Harness de evaluación de tono de Timón")
    parser.add_argument("--dataset", type=Path, default=Path("engine/eval/dataset.example.jsonl"))
    args = parser.parse_args()

    rows = load_dataset(args.dataset)
    print(f"Cargadas {len(rows)} filas de {args.dataset}")
    # TODO(rol C): generar con el motor + juez de tono + accuracy.
    raise SystemExit("Harness no implementado todavía (stub). Ver docstring.")


if __name__ == "__main__":
    main()
