import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from field_ai import generate_voice_prompts, map_speech_to_value
from form_parser import fetch_form_from_url, parse_form_html
from murf_client import (
    DEFAULT_VOICE,
    MurfAPIError,
    close_http_client,
    generate_audio_cached,
    resolve_voice_id,
)
from universal_voice import router as universal_router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SpeakSite Backend")
app.include_router(universal_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice_id: str | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Text must not be empty")
        return value.strip()


class HTMLBody(BaseModel):
    html: str


class URLBody(BaseModel):
    url: str


class MapFieldBody(BaseModel):
    speech: str
    field: dict


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "SpeakSite Backend"}


@app.post("/speak")
async def speak(request: SpeakRequest):
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="Text must not be empty")

    selected_voice = resolve_voice_id(request.voice_id or os.getenv("MURF_DEFAULT_VOICE", DEFAULT_VOICE))

    try:
        audio_bytes = await generate_audio_cached(request.text, selected_voice)
        return Response(content=audio_bytes, media_type="audio/mpeg", headers={"X-Voice-Id": selected_voice})
    except HTTPException:
        raise
    except MurfAPIError as exc:
        logger.error("Voice generation failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "error": str(exc),
                "fallback_text": request.text,
            },
        )
    except Exception as exc:
        logger.exception("Unexpected backend error")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "fallback_text": request.text,
            },
        )


@app.post("/parse-form-html")
async def parse_html_endpoint(body: HTMLBody):
    try:
        result = parse_form_html(body.html)
        result["fields"] = generate_voice_prompts(result["fields"])
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/parse-form-url")
async def parse_url_endpoint(body: URLBody):
    try:
        result = await fetch_form_from_url(body.url)
        result["fields"] = generate_voice_prompts(result["fields"])
        return result
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/map-fields")
async def map_field_endpoint(body: MapFieldBody):
    try:
        mapped = map_speech_to_value(body.speech, body.field)
        return mapped
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.on_event("shutdown")
async def shutdown_event() -> None:
    # WHY: Explicit shutdown keeps the pooled async HTTP client from leaking sockets.
    await close_http_client()
    logger.info("HTTP client closed cleanly")
