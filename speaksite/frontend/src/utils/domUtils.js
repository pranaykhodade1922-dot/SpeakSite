const cleanText = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export function getElementLabel(el) {
  if (!el) {
    return "";
  }

  const labelledBy = el.getAttribute("aria-labelledby");
  const labelledText = labelledBy
    ? labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.innerText || "")
        .join(" ")
    : "";

  return cleanText(
    el.getAttribute("aria-label") ||
      labelledText ||
      el.getAttribute("placeholder") ||
      el.getAttribute("title") ||
      el.getAttribute("alt") ||
      el.getAttribute("name") ||
      el.getAttribute("id")?.replace(/[-_]/g, " ") ||
      el.innerText?.trim().substring(0, 60) ||
      el.value?.trim().substring(0, 60) ||
      el.getAttribute("type") ||
      "",
  );
}

export function getElementType(el) {
  const tag = el?.tagName?.toLowerCase() || "";
  const type = el?.getAttribute("type")?.toLowerCase() || "";
  const role = el?.getAttribute("role")?.toLowerCase() || "";

  if (tag === "button") return "click";
  if (tag === "a") return "click";
  if (tag === "select") return "select";
  if (tag === "textarea") return "fill";
  if (tag === "input") {
    if (type === "checkbox" || type === "radio") return "check";
    if (type === "submit" || type === "button") return "click";
    if (type === "file") return "upload";
    return "fill";
  }
  if (role === "button" || role === "link" || role === "tab" || role === "menuitem" || role === "option") {
    return "click";
  }
  if (role === "checkbox" || role === "radio" || role === "switch") {
    return "check";
  }
  if (role === "combobox") {
    return "select";
  }
  return "click";
}

export function getElementSelector(el) {
  if (!el) {
    return "";
  }

  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  const testId = el.getAttribute("data-testid");
  if (testId) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }

  const name = el.getAttribute("name");
  if (name) {
    return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
  }

  const path = [];
  let current = el;

  while (current && current !== document.body && path.length < 5) {
    let selector = current.tagName.toLowerCase();

    if (current.classList?.length) {
      const classes = Array.from(current.classList)
        .filter((cls) => !/(hover|focus|active|selected|open)/i.test(cls))
        .slice(0, 2)
        .map((cls) => CSS.escape(cls))
        .join(".");
      if (classes) {
        selector += `.${classes}`;
      }
    }

    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (sibling) => sibling.tagName === current.tagName,
        )
      : [];
    if (siblings.length > 1) {
      selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

export function isElementVisible(el) {
  if (!el || typeof el.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") {
    return false;
  }

  return true;
}

export function getSelectOptions(el) {
  if (!el || el.tagName?.toLowerCase() !== "select") {
    return [];
  }

  return Array.from(el.options)
    .filter((option) => option.value && option.value !== "")
    .map((option) => ({
      value: option.value,
      label: cleanText(option.text),
    }));
}

export function getElementContext(el) {
  if (!el) {
    return "";
  }

  const context = [];

  if (el.id) {
    const linkedLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (linkedLabel) {
      context.push(cleanText(linkedLabel.innerText));
    }
  }

  const parentLabel = el.closest("label");
  if (parentLabel) {
    context.push(cleanText(parentLabel.innerText).substring(0, 60));
  }

  let prev = el.previousElementSibling;
  let steps = 0;
  while (prev && steps < 5) {
    if (/^H[1-6]$/.test(prev.tagName)) {
      context.push(cleanText(prev.innerText));
      break;
    }
    prev = prev.previousElementSibling;
    steps += 1;
  }

  const form = el.closest("form");
  if (form) {
    const legend = form.querySelector("legend, h1, h2, h3");
    if (legend) {
      context.push(cleanText(legend.innerText).substring(0, 40));
    }
  }

  return Array.from(new Set(context.filter(Boolean))).join(" | ");
}
