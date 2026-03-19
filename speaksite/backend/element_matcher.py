import json
import os
import re
from difflib import SequenceMatcher
from typing import Any

try:
    import anthropic
except ImportError:  # pragma: no cover - optional runtime dependency
    anthropic = None


SYSTEM_PROMPT = """You are a voice UI controller for a web accessibility tool. Your job is to match what a user said to the correct UI element on the page, then return the exact action to execute.

You receive:
- speech: what the user said
- elements: list of interactive elements on the page
- context: current page info

You must return ONLY valid JSON. No explanation. No markdown. No extra text. Just the JSON object.

Return this exact structure:

If you find a match:
{
  "matched": true,
  "confidence": 0.95,
  "action": {
    "type": "click|fill|select|check|scroll|focus",
    "selector": "the CSS selector from elements list",
    "label": "human readable name of element",
    "value": "text to fill in (for fill type only)",
    "optionValue": "option to select (for select only)"
  },
  "confirmationText": "Short spoken confirmation. Max 8 words.",
  "reasoning": "one line why you chose this element"
}

If no match:
{
  "matched": false,
  "confidence": 0.0,
  "reason": "why no match was found"
}"""

ACTION_HINTS = {
    "click": ["click", "press", "tap", "hit", "push", "open"],
    "fill": ["fill", "type", "enter", "put", "write", "set"],
    "select": ["select", "choose", "pick"],
    "check": ["check", "tick", "enable", "uncheck", "untick", "disable", "remove"],
    "scroll": ["go to", "scroll to", "find", "show me", "focus"],
}

LANGUAGE_SYNONYMS = {
    "login": ["login", "log in", "sign in", "लॉगिन", "लॉगिन करें", "iniciar sesión"],
    "signup": ["signup", "sign up", "register", "create account", "रजिस्टर", "inscribirse"],
    "submit": ["submit", "send", "done", "enviar", "जमा"],
    "email": ["email", "e mail", "मेल", "ईमेल"],
    "name": ["name", "full name", "नाम"],
    "password": ["password", "पासवर्ड"],
    "close": ["close", "x", "cancel", "बंद"],
}


def _normalize(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^\w\s@.+-]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def _detect_intent(speech: str, elements: list[dict[str, Any]]) -> str:
    normalized = _normalize(speech)

    for intent, keywords in ACTION_HINTS.items():
        if any(keyword in normalized for keyword in keywords):
            if intent == "select" and any(element.get("type") == "select" for element in elements):
                return "select"
            if intent == "check" and any(element.get("type") == "check" for element in elements):
                return "check"
            return intent

    if " with " in normalized or " to " in normalized:
        if any(element.get("type") == "select" for element in elements):
            return "select"
        if any(element.get("type") == "fill" for element in elements):
            return "fill"

    return "click"


def _expand_aliases(text: str) -> str:
    normalized = _normalize(text)
    expanded = [normalized]
    for canonical, aliases in LANGUAGE_SYNONYMS.items():
        if any(alias in normalized for alias in aliases):
            expanded.append(canonical)
    return " ".join(expanded)


def _extract_value(speech: str, action_type: str) -> str:
    normalized = speech.strip()
    patterns = [
        r"(?:with|as|to)\s+(.+)$",
        r"(?:in|into)\s+.+?\s+(?:with|as|to)\s+(.+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, normalized, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip().strip('"')

    if action_type == "fill":
        parts = re.split(r"\b(?:fill|type|enter|put|write|set)\b", normalized, flags=re.IGNORECASE)
        if len(parts) > 1:
            return parts[-1].strip().strip('"')

    return ""


def _element_score(speech: str, element: dict[str, Any], action_type: str) -> float:
    haystack = " ".join(
        [
            _expand_aliases(element.get("label", "")),
            _normalize(element.get("ctx", "")),
            _normalize(element.get("val", "")),
            " ".join(_normalize(option.get("label", "")) for option in element.get("opts", [])[:10]),
        ]
    ).strip()
    speech_norm = _expand_aliases(speech)

    if not haystack:
        return 0.0

    ratio = SequenceMatcher(None, speech_norm, haystack).ratio()
    overlap = len(set(speech_norm.split()) & set(haystack.split()))
    score = ratio + min(overlap * 0.08, 0.32)

    if action_type and element.get("type") == action_type:
        score += 0.18
    elif action_type == "click" and element.get("type") in {"click", "focus"}:
        score += 0.12

    if any(token in haystack for token in speech_norm.split() if len(token) > 2):
        score += 0.08

    return min(score, 0.99)


def _build_confirmation(action_type: str, label: str, value: str = "") -> str:
    if action_type == "fill":
        return f"Filled {label}."
    if action_type == "select":
        return f"Selected {value or label}."
    if action_type == "check":
        return f"Updated {label}."
    if action_type == "scroll":
        return f"Showing {label}."
    return f"Clicked {label}."


def _heuristic_match(speech: str, elements: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any]:
    limited_elements = elements[:50]
    action_type = _detect_intent(speech, limited_elements)
    best_element = None
    best_score = 0.0

    for element in limited_elements:
        score = _element_score(speech, element, action_type)
        if score > best_score:
            best_score = score
            best_element = element

    if not best_element or best_score < 0.5:
        return {
            "matched": False,
            "confidence": round(best_score, 2),
            "reason": "No reliable UI element match found",
        }

    value = _extract_value(speech, action_type)
    option_value = value
    resolved_type = action_type

    if best_element.get("type") == "select" and resolved_type in {"fill", "click"}:
        resolved_type = "select"
    elif best_element.get("type") == "fill" and resolved_type == "select":
        resolved_type = "fill"
    elif best_element.get("type") == "check":
        resolved_type = "check"
        if any(keyword in _normalize(speech) for keyword in ["uncheck", "untick", "disable", "remove"]):
            value = "uncheck"
    elif resolved_type == "scroll":
        resolved_type = "scroll"
    else:
        resolved_type = best_element.get("type") or resolved_type

    if resolved_type == "select" and not option_value:
        options = best_element.get("opts", [])
        speech_norm = _normalize(speech)
        option_match = next(
            (
                option
                for option in options
                if _normalize(option.get("label", "")) in speech_norm
                or speech_norm in _normalize(option.get("label", ""))
            ),
            None,
        )
        option_value = option_match.get("label", "") if option_match else ""

    action = {
        "type": resolved_type,
        "selector": best_element.get("sel"),
        "label": best_element.get("label"),
        "value": value if resolved_type in {"fill", "check"} else "",
        "optionValue": option_value if resolved_type == "select" else "",
    }

    return {
        "matched": True,
        "confidence": round(best_score, 2),
        "action": action,
        "confirmationText": _build_confirmation(resolved_type, best_element.get("label", "item"), option_value),
        "reasoning": f"Matched '{speech}' to '{best_element.get('label')}' using heuristic scoring.",
    }


async def _anthropic_match(speech: str, elements: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any]:
    client = anthropic.Anthropic()
    user_message = f"""Speech: "{speech}"

Page: {context.get('title', 'Unknown')}
URL: {context.get('url', '')}

Interactive elements on page:
{json.dumps(elements[:50], indent=2, ensure_ascii=False)}

Match the speech to the correct element and return the action JSON."""

    message = client.messages.create(
        model="claude-opus-4-1",
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"```json|```", "", raw).strip()
    result = json.loads(raw)

    if "matched" not in result:
        raise ValueError("Missing 'matched' field")
    if result.get("matched") and "action" not in result:
        raise ValueError("Matched but no action provided")

    return result


async def match_element(speech: str, elements: list, context: dict | None = None) -> dict:
    context = context or {}

    try:
        if anthropic is not None and os.getenv("ANTHROPIC_API_KEY", "").strip():
            return await _anthropic_match(speech, elements, context)
    except Exception as exc:
        print(f"[Element Matcher] Anthropic fallback triggered: {exc}")

    try:
        return _heuristic_match(speech, elements, context)
    except Exception as exc:
        print(f"[Element Matcher] Error: {exc}")
        return {
            "matched": False,
            "confidence": 0,
            "reason": str(exc),
        }
