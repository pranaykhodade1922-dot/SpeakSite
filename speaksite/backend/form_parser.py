import re

import httpx
from bs4 import BeautifulSoup

FIELD_TYPES = [
    "text",
    "email",
    "password",
    "tel",
    "number",
    "date",
    "time",
    "url",
    "search",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "file",
]


def parse_form_html(html: str) -> dict:
    """
    Parse raw HTML and extract all form fields.
    Returns structured field list with labels, types,
    names, placeholders, and options (for select/radio).
    """
    soup = BeautifulSoup(html, "html.parser")
    fields = []

    forms = soup.find_all("form")
    if forms:
        target = max(forms, key=lambda form: len(form.find_all(["input", "select", "textarea"])))
    else:
        target = soup

    inputs = target.find_all(["input", "select", "textarea"])

    for el in inputs:
        tag = el.name
        input_type = el.get("type", "text").lower()

        if input_type in ["hidden", "submit", "reset", "button", "image"]:
            continue

        field = {
            "id": el.get("id", ""),
            "name": el.get("name", ""),
            "type": tag if tag != "input" else input_type,
            "placeholder": el.get("placeholder", ""),
            "required": el.has_attr("required"),
            "label": "",
            "options": [],
            "value": "",
        }

        if field["id"]:
            label = soup.find("label", {"for": field["id"]})
            if label:
                field["label"] = label.get_text(strip=True)

        if not field["label"]:
            parent = el.find_parent("label")
            if parent:
                text = parent.get_text(separator=" ", strip=True)
                field["label"] = re.sub(r"\s+", " ", text)

        if not field["label"]:
            field["label"] = (
                el.get("aria-label", "")
                or el.get("placeholder", "")
                or field["name"].replace("-", " ").replace("_", " ").title()
            )

        if tag == "select":
            for opt in el.find_all("option"):
                val = opt.get("value", "")
                txt = opt.get_text(strip=True)
                if txt and val != "":
                    field["options"].append({"value": val, "label": txt})

        if input_type in ["radio", "checkbox"]:
            group_name = field["name"]
            siblings = target.find_all("input", {"type": input_type, "name": group_name})
            for sib in siblings:
                sib_label = ""
                if sib.get("id"):
                    lbl = soup.find("label", {"for": sib["id"]})
                    if lbl:
                        sib_label = lbl.get_text(strip=True)
                if not sib_label:
                    sib_label = sib.get("value", "")
                field["options"].append({"value": sib.get("value", ""), "label": sib_label})

        fields.append(field)

    seen = set()
    unique = []
    for field in fields:
        key = (field["name"], field["type"])
        if field["type"] in ["radio", "checkbox"]:
            if key in seen:
                continue
            seen.add(key)
        unique.append(field)

    title_el = soup.find("title")
    return {
        "fields": unique,
        "field_count": len(unique),
        "form_action": target.get("action", "") if forms else "",
        "form_method": target.get("method", "post") if forms else "post",
        "page_title": title_el.get_text(strip=True) if title_el else "Unknown Form",
    }


async def fetch_form_from_url(url: str) -> dict:
    """
    Fetch HTML from a URL server-side (bypasses CORS).
    Returns parsed form fields same as parse_form_html.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; SpeakSite/1.0; form accessibility bot)"
    }

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "text/html" not in content_type:
        raise ValueError(f"URL did not return HTML. Got: {content_type}")

    return parse_form_html(response.text)
