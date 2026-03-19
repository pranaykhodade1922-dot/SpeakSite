from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from element_matcher import match_element

router = APIRouter()


class MatchRequest(BaseModel):
    speech: str
    elements: list[dict[str, Any]]
    context: dict[str, Any] | None = None


@router.post("/match-element")
async def match_element_endpoint(body: MatchRequest):
    if not body.speech.strip():
        raise HTTPException(status_code=400, detail="Speech cannot be empty")

    if not body.elements:
        raise HTTPException(status_code=400, detail="No elements provided")

    print(f"[Universal Voice] Matching: '{body.speech}' against {len(body.elements)} elements")

    result = await match_element(
        speech=body.speech,
        elements=body.elements,
        context=body.context or {},
    )

    print(f"[Universal Voice] Result: {result}")
    return result
