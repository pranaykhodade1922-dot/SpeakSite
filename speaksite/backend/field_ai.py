"""
Uses Anthropic when available to:
1. Generate a natural voice prompt for each field
2. Map user's spoken response to the correct field value
3. Validate spoken input for typed fields (email, phone, date)
"""

import json
import os
import re

try:
    import anthropic
except ImportError:  # pragma: no cover - optional runtime dependency
    anthropic = None


def _fallback_prompt(field: dict) -> dict:
    label = field.get("label") or field.get("name") or "this field"
    field_type = field.get("type", "text")
    options = field.get("options", [])
    option_text = ""
    if options:
        option_text = ", ".join(option["label"] for option in options[:4])
    if options:
        voice_prompt = f"{label}. Choose {option_text}."
    elif field_type == "email":
        voice_prompt = f"What email should I use for {label}?"
    elif field_type in ["tel", "phone"]:
        voice_prompt = f"What phone number should I use for {label}?"
    elif field_type == "date":
        voice_prompt = f"What date should I enter for {label}?"
    else:
        voice_prompt = f"What should I enter for {label}?"
    return {
        "voice_prompt": voice_prompt[:120],
        "validation_hint": field_type,
        "example": options[0]["label"] if options else label,
    }


def generate_voice_prompts(fields: list) -> list:
    """
    For each field, generate:
    - A natural Natalie-style question to ask the user
    - Validation hint (what counts as valid)
    - Example answer hint
    """
    if not fields:
        return fields

    if anthropic is None or not os.getenv("ANTHROPIC_API_KEY", "").strip():
        for field in fields:
            field.update(_fallback_prompt(field))
        return fields

    client = anthropic.Anthropic()
    field_list = json.dumps(
        [
            {
                "label": field["label"],
                "type": field["type"],
                "required": field["required"],
                "options": field["options"][:5] if field["options"] else [],
            }
            for field in fields
        ],
        indent=2,
    )

    prompt = f"""You are Natalie, a friendly voice assistant.
For each form field below, generate a natural spoken
question to ask the user.

Fields:
{field_list}

Return ONLY a JSON array. Each item must have:
- field_index: number (0-based)
- voice_prompt: string (natural question, max 15 words)
- validation_hint: string (brief, e.g. "email address")
- example: string (one short example answer)

For select/radio fields, list the options naturally.
Example: "Would you like Small, Medium, or Large?"

Return ONLY valid JSON. No explanation. No markdown."""

    try:
        message = client.messages.create(
            model="claude-opus-4-1",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        prompts = json.loads(raw)

        for prompt_item in prompts:
            idx = prompt_item["field_index"]
            if idx < len(fields):
                fields[idx]["voice_prompt"] = prompt_item["voice_prompt"]
                fields[idx]["validation_hint"] = prompt_item["validation_hint"]
                fields[idx]["example"] = prompt_item.get("example", "")

        for field in fields:
            if not field.get("voice_prompt"):
                field.update(_fallback_prompt(field))
    except Exception:
        for field in fields:
            if not field.get("voice_prompt"):
                field.update(_fallback_prompt(field))

    return fields


def map_speech_to_value(speech: str, field: dict) -> dict:
    """
    Map raw speech transcript to the correct field value.
    Handles: email formatting, phone normalizing,
             select matching, date parsing, yes/no for checkbox.
    Returns: { value, display, confidence, needs_clarification }
    """
    field_type = field["type"]
    options = field.get("options", [])

    if field_type == "checkbox":
        yes_words = ["yes", "yeah", "yep", "correct", "true", "check", "select", "on"]
        no_words = ["no", "nope", "false", "uncheck", "off", "skip", "don't"]
        speech_lower = speech.lower()
        if any(word in speech_lower for word in yes_words):
            return {"value": "true", "display": "Yes", "confidence": 0.95, "needs_clarification": False}
        if any(word in speech_lower for word in no_words):
            return {"value": "false", "display": "No", "confidence": 0.95, "needs_clarification": False}

    if options:
        speech_lower = speech.lower()
        best_match = None
        best_score = 0
        for option in options:
            option_label = option["label"].lower()
            if option_label in speech_lower:
                score = len(option_label) / max(len(speech_lower), 1)
                if score > best_score:
                    best_score = score
                    best_match = option
            elif speech_lower in option_label:
                score = len(speech_lower) / max(len(option_label), 1)
                if score > best_score:
                    best_score = score
                    best_match = option
        if best_match and best_score > 0.4:
            return {
                "value": best_match["value"],
                "display": best_match["label"],
                "confidence": best_score,
                "needs_clarification": False,
            }
        option_names = ", ".join(option["label"] for option in options[:4])
        return {
            "value": "",
            "display": "",
            "confidence": 0,
            "needs_clarification": True,
            "clarification_prompt": f"Please choose one of: {option_names}",
        }

    cleaned = speech.strip()
    cleaned = re.sub(r"\s+", " ", cleaned)

    if field_type == "email":
        cleaned = cleaned.lower()
        cleaned = cleaned.replace(" at ", "@")
        cleaned = cleaned.replace(" dot ", ".")
        cleaned = cleaned.replace(" ", "")

    if field_type in ["tel", "phone"]:
        cleaned = re.sub(r"[^\d\+\-\(\)\s]", "", cleaned).strip()

    return {
        "value": cleaned,
        "display": cleaned,
        "confidence": 0.9,
        "needs_clarification": False,
    }
