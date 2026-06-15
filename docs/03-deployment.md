# Despliegue

**El LLM NO cabe en Vercel** (serverless, sin GPU, límites de tamaño/tiempo).

| Pieza | Dónde | Notas |
|-------|-------|-------|
| Frontend (Next.js) | **Vercel** | `NEXT_PUBLIC_API_URL` apunta al host GPU |
| Backend + engine + Gemma | **Host GPU** | Cluster universidad (L4) o **RunPod** |

## Host GPU: dos opciones
- **Cluster universidad (NVIDIA L4, 24 GB)** — opción de la presentación.
- **RunPod** (pod GPU on-demand: L4 / A10 / A100) — alternativa flexible.

Se despliega con `engine/Dockerfile` (imagen CUDA) y `TIMON_ENGINE=gemma`.

## Sizing del modelo
- Gemma 2 **2B** entra holgado en L4.
- Gemma 2 **9B** entra con cuantización.
- GemmaScope (SAEs) suma memoria — considerar al elegir tamaño.

## Frontend en Vercel
- Root del proyecto: `frontend/`.
- Variable de entorno: `NEXT_PUBLIC_API_URL` = URL pública HTTPS del host GPU.
