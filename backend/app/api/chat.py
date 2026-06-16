"""POST /api/chat → respuesta en streaming (SSE) con tono aplicado."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.engine_provider import get_engine
from app.schemas import ChatRequest
from timon_engine.base import SteeringEngine

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(req: ChatRequest, engine: SteeringEngine = Depends(get_engine)) -> StreamingResponse:
    async def event_stream():
        async for chunk in engine.generate(req.prompt, req.knobs, req.mode):
            # Formato SSE: cada token como un evento "data:".
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
