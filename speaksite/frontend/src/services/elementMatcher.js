import { getElementLabel } from "../utils/domUtils";

const MATCH_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/match-element`;

export async function matchSpeechToElement(speech, voiceMap, pageContext = {}) {
  try {
    const response = await fetch(MATCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speech,
        elements: voiceMap,
        context: pageContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("[SpeakSite Matcher] Result:", result);
    return result;
  } catch (error) {
    console.error("[SpeakSite Matcher] Failed:", error);
    return {
      matched: false,
      confidence: 0,
      reason: error.message,
    };
  }
}

export function buildPageContext() {
  return {
    url: window.location.href,
    title: document.title,
    currentFocus: document.activeElement ? getElementLabel(document.activeElement) : null,
    scrollY: window.scrollY,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}
