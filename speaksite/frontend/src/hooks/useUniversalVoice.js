import { useCallback, useRef } from "react";
import { useDOMScanner } from "./useDOMScanner";
import { buildPageContext, matchSpeechToElement } from "../services/elementMatcher";

export function useUniversalVoice({ speak, onActionTaken }) {
  const { voiceMap, scanStatus, elementCount, scanDOM, getVoiceMapSummary, executeAction } =
    useDOMScanner("speaksite-demo-content");
  const lastActionRef = useRef(null);

  const handleUniversalCommand = useCallback(
    async (speech) => {
      if (!speech?.trim()) {
        return false;
      }

      if (voiceMap.length === 0) {
        return false;
      }

      console.log("[SpeakSite Universal] Processing:", speech, `(${elementCount} elements available)`);

      const summary = getVoiceMapSummary();
      const pageContext = buildPageContext();
      const match = await matchSpeechToElement(speech, summary, pageContext);

      if (!match.matched || match.confidence < 0.5) {
        console.log("[SpeakSite Universal] No match, confidence:", match.confidence);
        return false;
      }

      console.log("[SpeakSite Universal] Match found:", match.action);
      const result = executeAction(match.action);

      if (result.success) {
        lastActionRef.current = match.action;
        const confirmation = match.confirmationText || result.message || `Done. ${match.action.label}.`;
        void speak(confirmation);
        onActionTaken?.({
          speech,
          action: match.action,
          message: confirmation,
          success: true,
        });
        return true;
      }

      const errorMsg = `I found the element but could not interact with it. ${result.reason || ""}`.trim();
      void speak(errorMsg);
      onActionTaken?.({
        speech,
        action: match.action,
        message: errorMsg,
        success: false,
      });
      return true;
    },
    [elementCount, executeAction, getVoiceMapSummary, onActionTaken, speak, voiceMap.length],
  );

  const readPageAloud = useCallback(() => {
    if (voiceMap.length === 0) {
      void speak("I cannot find any interactive elements on this page.");
      return;
    }

    const buttons = voiceMap
      .filter((entry) => entry.type === "click")
      .map((entry) => entry.label)
      .slice(0, 5);

    const inputs = voiceMap
      .filter((entry) => entry.type === "fill")
      .map((entry) => entry.label)
      .slice(0, 5);

    let summary = `I can see ${voiceMap.length} interactive elements. `;
    if (buttons.length > 0) {
      summary += `Buttons: ${buttons.join(", ")}. `;
    }
    if (inputs.length > 0) {
      summary += `Input fields: ${inputs.join(", ")}. `;
    }
    summary += "Say the name of any element to interact.";

    void speak(summary);
  }, [speak, voiceMap]);

  return {
    handleUniversalCommand,
    readPageAloud,
    voiceMap,
    scanStatus,
    elementCount,
    scanDOM,
    lastActionRef,
  };
}
