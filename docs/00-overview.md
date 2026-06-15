# Timón — Visión general

Middleware de **tono** para LLMs. Perillas semánticas (Formalidad, Urgencia,
Calidez, Detalle, 0–100) que aplican *activation steering* sobre Gemma 2/3 con
GemmaScope + SAELens. El modelo se empuja por dentro, token por token, en el
forward pass — no se reescribe el prompt ni el texto como bloque.

- **Modo respuesta:** instrucción + perillas → respuesta con ese tono.
- **Modo reescritura:** texto existente → re-tonificado.
- **Presets de voz:** calibrar las perillas una vez y aplicarlas a todo.

Meta: webapp desplegada, steering estable y evaluado (≥80% de aciertos de tono),
demo de atención a cliente en 5 semanas.
