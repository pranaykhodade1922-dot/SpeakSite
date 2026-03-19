import re
from typing import Dict, Optional

INTENTS = {
    "NAVIGATE_HOME": [
        re.compile(r"^(?:go\s+to|open|show|take\s+me\s+to)\s+(?:the\s+)?home(?:\s+page)?$"),
        re.compile(r"^(?:back\s+to|return\s+to)\s+(?:the\s+)?home(?:\s+page)?$"),
        re.compile(r"^(?:home\s+page|home)$"),
    ],
    "NAVIGATE_SIGNUP": [
        re.compile(r"^(?:go\s+to|open|show)\s+(?:the\s+)?(?:sign\s*up|signup)(?:\s+page)?$"),
        re.compile(r"^(?:go\s+to|open|show)\s+(?:the\s+)?registration\s+page$"),
        re.compile(r"^(?:create\s+account|i\s+want\s+to\s+create\s+an?\s+account)$"),
    ],
    "NAVIGATE_CONTACT": [
        re.compile(r"^(?:go\s+to|open|show)\s+(?:the\s+)?contact(?:\s+page)?$"),
        re.compile(r"^(?:go\s+to|open|show)\s+contact\s+us$"),
        re.compile(r"^(?:contact\s+page|contact\s+us)$"),
    ],
    "SUBMIT_FORM": [
        re.compile(r"^submit$"),
        re.compile(r"^submit(?:\s+the)?\s+form$"),
        re.compile(r"^send(?:\s+the)?(?:\s+form|\s+it)?$"),
    ],
    "REPEAT": [
        re.compile(r"^repeat$"),
        re.compile(r"^say\s+again$"),
        re.compile(r"^what\s+did\s+you\s+say$"),
    ],
}

FIELD_ALIASES = {
    "name": "name",
    "full name": "name",
    "email": "email",
    "email address": "email",
    "message": "message",
}

FILL_PATTERNS = [
    re.compile(
        r"^fill\s+(?P<field>name|full\s+name|email|email\s+address|message)\s+with\s+(?P<value>.+)$"
    ),
    re.compile(
        r"^set\s+(?P<field>name|full\s+name|email|email\s+address|message)\s+to\s+(?P<value>.+)$"
    ),
    re.compile(
        r"^my\s+(?P<field>name|full\s+name|email|email\s+address|message)\s+is\s+(?P<value>.+)$"
    ),
    re.compile(
        r"^enter\s+(?P<value>.+)\s+in\s+(?P<field>name|full\s+name|email|email\s+address|message)$"
    ),
]


def _normalize_field(raw_field: str) -> Optional[str]:
    normalized = re.sub(r"\s+", " ", raw_field.strip().lower())
    return FIELD_ALIASES.get(normalized)


def parse_command(text: str) -> Dict[str, Optional[str]]:
    normalized_text = re.sub(r"\s+", " ", text.lower().strip())

    if not normalized_text:
        return {
            "intent": "UNKNOWN",
            "entity": None,
            "field": None,
            "response_text": "I didn't catch that. Try saying 'go to signup page' or 'fill email with your email'.",
        }

    for pattern in FILL_PATTERNS:
        match = pattern.match(normalized_text)
        if match:
            field = _normalize_field(match.group("field"))
            entity = match.group("value").strip()
            if field and entity:
                return {
                    "intent": "FILL_FIELD",
                    "entity": entity,
                    "field": field,
                    "response_text": f"Got it. I've filled in the {field} field.",
                }

    for intent, patterns in INTENTS.items():
        for pattern in patterns:
            if pattern.match(normalized_text):
                response_text = {
                    "NAVIGATE_HOME": "Opening the home page.",
                    "NAVIGATE_SIGNUP": "Opening the sign up page. Please fill in your name and email.",
                    "NAVIGATE_CONTACT": "Opening the contact page.",
                    "SUBMIT_FORM": "Form submitted successfully. Thank you!",
                    "REPEAT": "",
                }[intent]
                return {
                    "intent": intent,
                    "entity": None,
                    "field": None,
                    "response_text": response_text,
                }

    return {
        "intent": "UNKNOWN",
        "entity": None,
        "field": None,
        "response_text": "I didn't catch that. Try saying 'go to signup page' or 'fill email with your email'.",
    }


if __name__ == "__main__":
    samples = [
        "go to home",
        "open signup page",
        "contact us",
        "fill name with Rahul",
        "set email to rahul@gmail.com",
        "enter hello there in message",
        "submit form",
        "say again",
        "do something random",
    ]
    for sample in samples:
        print(f"{sample!r} -> {parse_command(sample)}")
