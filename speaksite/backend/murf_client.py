import hashlib
import logging
import os
import time

import httpx
from fastapi import HTTPException

MURF_API_URL = "https://api.murf.ai/v1/speech/generate"
DEFAULT_VOICE = "en-US-natalie"

logger = logging.getLogger(__name__)

APPROVED_VOICES = [
    "en-US-natalie",
    "en-US-ken",
    "hi-IN-shweta",
    "hi-IN-aarav",
    "es-ES-lucia",
    "es-ES-sergio",
    "fr-FR-juliette",
    "fr-FR-maxime",
]

_audio_cache: dict[str, bytes] = {}

http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(connect=2.0, read=6.0, write=2.0, pool=1.0),
    limits=httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=30.0),
    headers={"Connection": "keep-alive"},
)


class MurfAPIError(Exception):
    """Raised when Murf audio generation fails."""


def resolve_voice_id(voice_id: str | None) -> str:
    requested_voice = (voice_id or os.getenv("MURF_DEFAULT_VOICE", DEFAULT_VOICE)).strip()
    if requested_voice not in APPROVED_VOICES:
        logger.warning("Invalid or missing Murf voice_id '%s'. Falling back to %s.", requested_voice, DEFAULT_VOICE)
        return DEFAULT_VOICE
    return requested_voice


async def _post_generate(payload: dict, headers: dict) -> dict:
    try:
        response = await http_client.post(MURF_API_URL, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        logger.exception("Timed out calling Murf generate endpoint")
        raise HTTPException(status_code=504, detail="Murf request timed out") from exc
    except httpx.RequestError as exc:
        logger.exception("Failed to reach Murf generate endpoint")
        raise HTTPException(status_code=503, detail="Murf request failed") from exc

    if response.status_code != 200:
        logger.error("Murf generate returned %s: %s", response.status_code, response.text)
        raise HTTPException(status_code=response.status_code, detail="Murf generate request failed")

    try:
        return response.json()
    except ValueError as exc:
        logger.exception("Murf generate returned invalid JSON")
        raise HTTPException(status_code=502, detail="Murf returned invalid JSON") from exc


async def _download_audio(audio_url: str) -> bytes:
    try:
        response = await http_client.get(audio_url)
    except httpx.TimeoutException as exc:
        logger.exception("Timed out downloading Murf audio")
        raise HTTPException(status_code=504, detail="Murf audio download timed out") from exc
    except httpx.RequestError as exc:
        logger.exception("Failed to download Murf audio")
        raise HTTPException(status_code=503, detail="Murf audio download failed") from exc

    if response.status_code != 200:
        logger.error("Murf audio download returned %s", response.status_code)
        raise HTTPException(status_code=response.status_code, detail="Murf audio download failed")

    audio_bytes = response.content
    if not audio_bytes:
        raise HTTPException(status_code=502, detail="Murf returned empty audio")
    return audio_bytes


async def generate_audio(text: str, voice_id: str = DEFAULT_VOICE) -> bytes:
    api_key = os.getenv("MURF_API_KEY", "").strip()
    if not api_key:
        raise MurfAPIError("MURF_API_KEY not configured")

    final_voice_id = resolve_voice_id(voice_id)
    payload = {
        "text": text,
        "voiceId": final_voice_id,
        "style": "Conversational",
        "modelVersion": "GEN2",
        "sampleRate": 24000,
        "format": "MP3",
        "speed": 0,
        "pitch": 0,
    }
    headers = {"api-key": api_key, "Content-Type": "application/json"}

    started_at = time.perf_counter()
    logger.info("Murf request started voice_id=%s text_length=%s", final_voice_id, len(text))

    try:
        data = await _post_generate(payload, headers)

        audio_url = None
        if isinstance(data, dict):
            audio_url = (
                data.get("audioFile")
                or data.get("audioUrl")
                or data.get("file")
                or (data.get("result") or {}).get("audioFile")
                or (data.get("result") or {}).get("audioUrl")
            )

        if not audio_url:
            logger.error("Murf API response missing audio URL: %s", data)
            raise HTTPException(status_code=502, detail="Murf response missing audio URL")

        audio_bytes = await _download_audio(audio_url)
        return audio_bytes
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected Murf client failure")
        raise MurfAPIError(f"Murf request failed: {exc}") from exc
    finally:
        elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
        logger.info(
            "Murf request finished voice_id=%s text_length=%s response_time_ms=%s",
            final_voice_id,
            len(text),
            elapsed_ms,
        )


async def generate_audio_cached(text: str, voice_id: str = DEFAULT_VOICE) -> bytes:
    cache_key = hashlib.md5(f"{resolve_voice_id(voice_id)}::{text}".encode()).hexdigest()

    if cache_key in _audio_cache:
        logger.info("[Murf Cache HIT] %s", text[:30])
        return _audio_cache[cache_key]

    logger.info("[Murf Cache MISS] %s", text[:30])
    audio_bytes = await generate_audio(text, voice_id)
    _audio_cache[cache_key] = audio_bytes
    return audio_bytes


async def close_http_client() -> None:
    await http_client.aclose()
