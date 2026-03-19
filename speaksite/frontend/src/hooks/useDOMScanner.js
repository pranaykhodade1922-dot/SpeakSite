import { useCallback, useEffect, useRef, useState } from "react";
import {
  getElementContext,
  getElementLabel,
  getElementSelector,
  getElementType,
  getSelectOptions,
  isElementVisible,
} from "../utils/domUtils";

const INTERACTIVE_SELECTORS = [
  "button:not([disabled])",
  "a[href]",
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="button"]:not([disabled])',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useDOMScanner(containerId = "speaksite-demo-content") {
  const [voiceMap, setVoiceMap] = useState([]);
  const [scanStatus, setScanStatus] = useState("idle");
  const [elementCount, setElementCount] = useState(0);
  const observerRef = useRef(null);
  const scanTimerRef = useRef(null);
  const lastScanRef = useRef(0);
  const getContainer = useCallback(() => {
    if (typeof document === "undefined") {
      return null;
    }

    const host = document.getElementById(containerId);
    const iframe = host?.querySelector("iframe");
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc?.body) {
          return iframeDoc.body;
        }
      } catch (error) {
        console.log("[SpeakSite Scanner] Cross-origin iframe — cannot scan. Using main content.");
      }
    }

    return host || document.body;
  }, [containerId]);

  const scanDOM = useCallback(() => {
    const container = getContainer();
    if (!container?.querySelectorAll) {
      return;
    }

    const now = Date.now();
    if (now - lastScanRef.current < 500) {
      return;
    }
    lastScanRef.current = now;

    setScanStatus("scanning");

    try {
      const elements = container.querySelectorAll(INTERACTIVE_SELECTORS);
      const map = [];
      const seenSelectors = new Set();
      const seenLabels = new Set();

      elements.forEach((el, index) => {
        if (!isElementVisible(el)) {
          return;
        }

        const label = getElementLabel(el);
        const type = getElementType(el);
        const selector = getElementSelector(el);
        const context = getElementContext(el);
        const options = getSelectOptions(el);

        if (!label || !selector) {
          return;
        }

        if (seenSelectors.has(selector)) {
          return;
        }
        seenSelectors.add(selector);

        const labelKey = `${type}::${label.toLowerCase()}`;
        if (seenLabels.has(labelKey)) {
          return;
        }
        seenLabels.add(labelKey);

        const rect = el.getBoundingClientRect();

        map.push({
          index,
          label,
          type,
          selector,
          context,
          options,
          tag: el.tagName.toLowerCase(),
          inputType: el.getAttribute("type") || "",
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          isRequired: el.hasAttribute("required"),
          currentValue: (el.value || el.innerText || "").toString().trim(),
        });
      });

      map.sort((a, b) => a.position.y - b.position.y);
      setVoiceMap(map);
      setElementCount(map.length);
      setScanStatus("ready");

      console.log(
        `[SpeakSite Scanner] Found ${map.length} elements`,
        map.map((entry) => `${entry.type}: ${entry.label}`),
      );
    } catch (error) {
      console.error("[SpeakSite Scanner] Scan failed:", error);
      setScanStatus("error");
    }
  }, [getContainer]);

  const debouncedScan = useCallback(() => {
    window.clearTimeout(scanTimerRef.current);
    scanTimerRef.current = window.setTimeout(scanDOM, 300);
  }, [scanDOM]);

  const createObserver = useCallback(
    () =>
      new MutationObserver((mutations) => {
        const significant = mutations.some(
          (mutation) =>
            mutation.addedNodes.length > 0 ||
            mutation.removedNodes.length > 0 ||
            (mutation.type === "attributes" &&
              ["hidden", "disabled", "aria-hidden", "style", "class", "aria-expanded"].includes(
                mutation.attributeName,
              )),
        );

        if (significant) {
          debouncedScan();
        }
      }),
    [debouncedScan],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const host = document.getElementById(containerId);
    if (!host) {
      return undefined;
    }

    const attachObserver = () => {
      const container = getContainer();
      if (!container) {
        return;
      }

      observerRef.current?.disconnect();
      observerRef.current = createObserver();
      observerRef.current.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "disabled", "aria-hidden", "style", "class", "aria-expanded"],
      });
    };

    scanDOM();
    attachObserver();

    const iframe = host.querySelector("iframe");
    let iframeTimer = 0;
    const handleIframeLoad = () => {
      window.clearTimeout(iframeTimer);
      iframeTimer = window.setTimeout(() => {
        lastScanRef.current = 0;
        scanDOM();
        attachObserver();
      }, 1500);
    };

    iframe?.addEventListener("load", handleIframeLoad);

    return () => {
      iframe?.removeEventListener("load", handleIframeLoad);
      window.clearTimeout(iframeTimer);
      observerRef.current?.disconnect();
      window.clearTimeout(scanTimerRef.current);
    };
  }, [containerId, createObserver, getContainer, scanDOM]);

  const getVoiceMapSummary = useCallback(
    () =>
      voiceMap.map((el) => ({
        i: el.index,
        label: el.label,
        type: el.type,
        sel: el.selector,
        ctx: el.context,
        opts: el.options?.slice(0, 10) || [],
        val: el.currentValue?.substring(0, 50) || "",
        req: el.isRequired,
        pos: `${el.position.y}px from top`,
      })),
    [voiceMap],
  );

  const executeAction = useCallback(
    (action) => {
      const container = getContainer();
      const el = container?.querySelector?.(action.selector);
      if (!el) {
        console.warn("[SpeakSite] Element not found:", action.selector);
        return { success: false, reason: "Element not found" };
      }

      try {
        switch (action.type) {
          case "click":
            el.focus?.();
            el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            el.click?.();
            return { success: true, message: `Clicked ${action.label}` };

          case "fill":
            el.focus?.();
            if (el.isContentEditable) {
              el.textContent = action.value || "";
              el.dispatchEvent(new InputEvent("input", { bubbles: true, data: action.value || "" }));
            } else {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
              )?.set;
              const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value",
              )?.set;
              const valueSetter =
                el.tagName === "TEXTAREA" ? nativeTextAreaValueSetter : nativeInputValueSetter;
              if (valueSetter) {
                valueSetter.call(el, action.value || "");
              } else {
                el.value = action.value || "";
              }
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return { success: true, message: `Filled ${action.label}` };

          case "select": {
            el.focus?.();
            const options = Array.from(el.options || []);
            const desired = (action.optionValue || "").toLowerCase();
            const match = options.find(
              (option) =>
                option.text.toLowerCase().includes(desired) || option.value.toLowerCase() === desired,
            );
            if (!match) {
              return { success: false, reason: `Option "${action.optionValue}" not found` };
            }
            el.value = match.value;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            return { success: true, message: `Selected ${match.text}` };
          }

          case "check":
            el.focus?.();
            if ("checked" in el) {
              el.checked = action.value === "uncheck" ? false : true;
              el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return {
              success: true,
              message: `${action.value === "uncheck" ? "Unchecked" : "Checked"} ${action.label}`,
            };

          case "scroll":
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            return { success: true, message: `Scrolled to ${action.label}` };

          case "focus":
            el.focus?.();
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            return { success: true, message: `Focused ${action.label}` };

          default:
            el.click?.();
            return { success: true, message: `Activated ${action.label}` };
        }
      } catch (error) {
        console.error("[SpeakSite] Action failed:", error);
        return { success: false, reason: error.message };
      }
    },
    [getContainer],
  );

  return {
    voiceMap,
    scanStatus,
    elementCount,
    scanDOM,
    getVoiceMapSummary,
    executeAction,
  };
}
