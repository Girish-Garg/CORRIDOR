import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.orchestrator import run_stream

router = APIRouter()


@router.get("/scenario/stream")
async def scenario_stream(q: str = ""):
    async def gen():
        async for kind, payload in run_stream({}, q):
            data = payload.model_dump_json() if hasattr(payload, "model_dump_json") else json.dumps(payload)
            yield f"event: {kind}\ndata: {data}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
