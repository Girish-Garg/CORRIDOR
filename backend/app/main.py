import asyncio
from contextlib import suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.init_db import init_db
from app.ingest import refresh_live_signals
from app.api.scenario_routes import router as scenario_router
from app.api.stream_routes import router as stream_router
from app.api.signals_routes import router as signals_router

app = FastAPI(title="CORRIDOR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenario_router)
app.include_router(stream_router)
app.include_router(signals_router)

# How often the background poller refreshes signals from public feeds.
POLL_SECONDS = 600


async def _poll_live():
    while True:
        try:
            await asyncio.to_thread(refresh_live_signals)
        except Exception:
            pass
        await asyncio.sleep(POLL_SECONDS)


@app.on_event("startup")
async def _startup():
    init_db()
    app.state.poller = asyncio.create_task(_poll_live())


@app.on_event("shutdown")
async def _shutdown():
    task = getattr(app.state, "poller", None)
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


@app.get("/health")
def health():
    return {"status": "ok"}
