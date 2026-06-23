from fastapi import APIRouter

from app import ingest

router = APIRouter()


@router.get("/signals/status")
def signals_status():
    return ingest.live_status()


@router.post("/signals/refresh")
def signals_refresh():
    return ingest.refresh_live_signals()
