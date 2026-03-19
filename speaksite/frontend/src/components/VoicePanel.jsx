import { useEffect, useMemo, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import useSpeechInput from "../hooks/useSpeechInput";
import useVoiceOutput from "../hooks/useVoiceOutput";
import { parseCommand } from "../utils/commandParser";
import LanguageSelector from "./LanguageSelector";
import ResponseLog from "./ResponseLog";
import SmartFormFiller from "./SmartFormFiller";
import StatusBadge from "./StatusBadge";
import Transcript from "./Transcript";
import { useUniversalVoice } from "../hooks/useUniversalVoice";
import { LANGUAGE_CONFIRMATIONS } from "../utils/languages";

const waveformBars = [
  { height: 12, delay: "0ms" },
  { height: 20, delay: "150ms" },
  { height: 16, delay: "300ms" },
];

const VoicePanel = () => {
  const {
    activePage,
    transcript,
    setTranscript,
    voiceStatus,
    setVoiceStatus,
    navigateTo,
    updateField,
    submitForm,
    addToLog,
    setSelectedLanguage,
    setSelectedGender,
    isDemoRunning,
    theme,
    toggleTheme,
    triggerDemo,
    t,
  } = useVoiceContext();
  const [lastResponse, setLastResponse] = useState(t.voicePanel.idlePrompt);
  const [lastCommand, setLastCommand] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [supportError, setSupportError] = useState("");
  const [sffOpen, setSffOpen] = useState(false);
  const [transcriptDisplay, setTranscriptDisplay] = useState({ text: "", isFinal: true });
  const { speak, isSpeaking, pendingResponseText } = useVoiceOutput();
  const { handleUniversalCommand, readPageAloud, scanStatus, elementCount, scanDOM } = useUniversalVoice({
    speak,
    onActionTaken: (result) => {
      addToLog(result.message, result.success ? "action" : "error");
      setLastCommand(result.speech);
      setLastAction(result.action?.label || "Universal voice action");
      setLastResponse(result.message);
      setVoiceStatus(result.success ? "speaking" : "idle");
    },
  });

  useEffect(() => {
    if (!transcript && voiceStatus === "idle") {
      setLastResponse(t.voicePanel.idlePrompt);
    }
  }, [t, transcript, voiceStatus]);

  const getFieldElement = (fieldName) => {
    const idMap = {
      name: activePage === "contact" ? "contact-name" : "signup-name",
      email: activePage === "contact" ? "contact-email" : "signup-email",
      message: "contact-message",
      password: "signup-password",
    };
    const elementId = idMap[fieldName];
    const byId = elementId ? document.getElementById(elementId) : null;
    if (byId) {
      return byId;
    }

    const fallbackSelectors = {
      name: 'input[type="text"]',
      email: 'input[type="email"]',
      message: "textarea",
      password: 'input[type="password"]',
    };

    return fallbackSelectors[fieldName] ? document.querySelector(fallbackSelectors[fieldName]) : null;
  };

  const buildLogEntry = (command) => {
    switch (command.intent) {
      case "NAVIGATE_HOME":
        return { text: t.logs.navigatedHome, type: "action", action: "Navigated to /" };
      case "NAVIGATE_SIGNUP":
        return { text: t.logs.navigatedSignup, type: "action", action: "Navigated to /signup" };
      case "NAVIGATE_CONTACT":
        return { text: t.logs.navigatedContact, type: "action", action: "Navigated to /contact" };
      case "FILL_FIELD":
        return {
          text: `${t.logs.filledField} ${command.field}: "${command.entity}"`,
          type: "action",
          action: `Filled ${command.field}`,
        };
      case "SUBMIT_FORM":
        return { text: `${t.logs.submittedForm} ${t.logs.submittedSuffix}`, type: "action", action: "Submitted form" };
      case "CHANGE_LANGUAGE":
        return {
          text: `${t.logs.langSwitched} ${command.language?.flag || ""} ${command.language?.name || ""}`.trim(),
          type: "system",
          action: `Switched language to ${command.language?.name || "selected language"}`,
        };
      case "START_DEMO":
        return { text: t.logs.demoStartedButton, type: "system", action: "Started guided demo" };
      case "STOP_DEMO":
        return { text: t.logs.demoStopped, type: "system", action: "Stopped guided demo" };
      case "HELP":
        return { text: t.logs.helpOpened, type: "system", action: "Opened help" };
      case "CLOSE_HELP":
        return { text: t.logs.helpClosed, type: "system", action: "Closed help" };
      case "SET_THEME_LIGHT":
        return { text: t.logs.themeLight, type: "system", action: "Switched to light theme" };
      case "SET_THEME_DARK":
        return { text: t.logs.themeDark, type: "system", action: "Switched to dark theme" };
      case "REPEAT":
        return { text: t.logs.repeatedResponse, type: "system", action: "Repeated response" };
      default:
        return { text: t.logs.unrecognized, type: "error", action: "No action taken" };
    }
  };

  const executeUIAction = (command) => {
    switch (command.intent) {
      case "NAVIGATE_HOME":
        navigateTo("home");
        break;
      case "NAVIGATE_SIGNUP":
        navigateTo("signup");
        break;
      case "NAVIGATE_CONTACT":
        navigateTo("contact");
        break;
      case "FILL_FIELD": {
        if (!command.field || !command.entity) {
          break;
        }

        if (activePage !== "contact" && command.field === "message") {
          navigateTo("contact");
        }

        updateField(command.field, command.entity);

        window.setTimeout(() => {
          const fieldElement = getFieldElement(command.field);
          if (!fieldElement) {
            return;
          }

          fieldElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
          fieldElement.focus();
          fieldElement.classList.add("voice-filled");

          window.setTimeout(() => {
            fieldElement.classList.remove("voice-filled");
            fieldElement.blur();
          }, 2000);
        }, 50);
        break;
      }
      case "SUBMIT_FORM":
        submitForm();
        break;
      case "CHANGE_LANGUAGE":
        if (command.language) {
          setSelectedLanguage(command.language);
          if (command.language.selectedGender) {
            setSelectedGender(command.language.selectedGender);
          }
        }
        break;
      case "SET_THEME_LIGHT":
        if (theme !== "light") {
          toggleTheme();
        }
        break;
      case "SET_THEME_DARK":
        if (theme !== "dark") {
          toggleTheme();
        }
        break;
      case "START_DEMO":
        if (triggerDemo) {
          triggerDemo();
        } else {
          window.dispatchEvent(new Event("start-guided-demo"));
        }
        break;
      case "STOP_DEMO":
        window.dispatchEvent(new Event("stop-guided-demo"));
        break;
      case "HELP":
        window.dispatchEvent(new Event("open-help"));
        break;
      case "CLOSE_HELP":
        window.dispatchEvent(new Event("close-help"));
        break;
      default:
        break;
    }
  };

  const processCommand = async (recognizedText) => {
    if (!recognizedText?.trim()) {
      setTranscript("");
      setTranscriptDisplay({ text: "", isFinal: true });
      setVoiceStatus("idle");
      return;
    }

    const lower = recognizedText.toLowerCase();
    const urlMatch = recognizedText.match(/(?:open|load|go to|navigate to)\s+(.+)/i);
    if (urlMatch) {
      const urlPart = urlMatch[1].trim();
      if (urlPart.includes(".") && !urlPart.includes(" ")) {
        const url = urlPart.startsWith("http") ? urlPart : `https://${urlPart}`;
        setTranscript(recognizedText);
        setTranscriptDisplay({ text: recognizedText, isFinal: true });
        setLastCommand(recognizedText);
        setLastAction(`Loaded ${urlPart}`);
        setLastResponse(`Loading ${urlPart}`);
        addToLog(`Loading external URL: ${url}`, "action");
        window.dispatchEvent(new CustomEvent("load-voice-url", { detail: { url } }));
        void speak(`Loading ${urlPart}`);
        return;
      }
    }

    if (
      lower.includes("what is on") ||
      lower.includes("what's on") ||
      lower.includes("read page") ||
      lower.includes("what can i") ||
      lower.includes("list elements")
    ) {
      readPageAloud();
      return;
    }

    const handled = await handleUniversalCommand(recognizedText);
    if (handled) {
      return;
    }

    const command = parseCommand(recognizedText);
    const responseText =
      command.intent === "CHANGE_LANGUAGE" && command.language
        ? LANGUAGE_CONFIRMATIONS[command.language.code] || command.response_text
        : command.intent === "REPEAT" && lastResponse !== t.voicePanel.idlePrompt
          ? lastResponse
          : command.intent === "REPEAT"
            ? t.voicePanel.repeatReady
            : command.response_text;
    const logEntry = buildLogEntry(command);

    setTranscript(recognizedText);
    setTranscriptDisplay({ text: recognizedText, isFinal: true });
    setVoiceStatus("processing");
    setLastCommand(recognizedText);
    setLastAction(logEntry.action);

    executeUIAction(command);
    addToLog(logEntry.text, logEntry.type);
    setLastResponse(responseText);

    void speak(
      responseText,
      undefined,
      command.intent === "CHANGE_LANGUAGE" && command.language
        ? {
            voiceId: command.language.voiceId,
            lang: command.language.code,
          }
        : undefined,
    );
  };

  const handleResult = (finalTranscript) => {
    setTranscript(finalTranscript);
    setTranscriptDisplay({ text: finalTranscript, isFinal: true });
    void processCommand(finalTranscript);
  };

  const handleInterim = (partialTranscript, isFinal = false) => {
    setTranscript(partialTranscript);
    setTranscriptDisplay({ text: partialTranscript, isFinal });
  };

  const handleError = (message) => {
    if (message === "Your browser doesn't support voice input. Try Chrome or Edge.") {
      setSupportError(t.voicePanel.unsupported);
    }

    if (message === "No speech detected.") {
      setTranscript("");
      setTranscriptDisplay({ text: "", isFinal: true });
      setVoiceStatus("idle");
      return;
    }

    if (message === "I couldn't match that to a command.") {
      setLastResponse(t.voicePanel.notCaught);
      addToLog(t.logs.unrecognized, "error");
      setVoiceStatus("idle");
      return;
    }

    addToLog(message, "error");
    setVoiceStatus("idle");
  };

  const { startListening, stopListening, isListening, isSupported } = useSpeechInput(
    handleResult,
    handleError,
    handleInterim,
  );

  const speakOnboarding = async (text, onComplete) => {
    stopListening();
    await speak(
      text,
      () => {
        setTranscript("");
        setTranscriptDisplay({ text: "", isFinal: true });
        if (onComplete) {
          onComplete();
        }
      },
      {
        voiceId: "en-US-natalie",
        lang: "en-US",
      },
    );
  };

  const handleRunDemo = () => {
    if (triggerDemo) {
      triggerDemo();
    } else {
      window.dispatchEvent(new Event("start-guided-demo"));
    }
  };

  const effectiveStatus = useMemo(() => {
    if (isListening) {
      return "listening";
    }
    if (isSpeaking) {
      return "speaking";
    }
    return voiceStatus;
  }, [isListening, isSpeaking, voiceStatus]);

  const toggleListening = () => {
    setSupportError("");

    if (isDemoRunning) {
      return;
    }

    if (!isSupported) {
      setSupportError(t.voicePanel.unsupported);
      addToLog(t.voicePanel.unsupported, "error");
      return;
    }

    if (isListening) {
      stopListening();
      setVoiceStatus("idle");
      return;
    }

    setTranscript("");
    setTranscriptDisplay({ text: "", isFinal: true });
    setVoiceStatus("listening");
    startListening();
  };

  useEffect(() => {
    const handleToggleMic = () => {
      document.getElementById("mic-btn")?.click();
    };

    window.addEventListener("toggle-mic", handleToggleMic);
    return () => {
      window.removeEventListener("toggle-mic", handleToggleMic);
    };
  }, []);

  const buttonStateClass =
    effectiveStatus === "listening"
      ? "hero-mic-shell is-listening border-[var(--success)] bg-[rgba(0,224,122,0.10)]"
      : effectiveStatus === "speaking"
        ? "hero-mic-shell is-speaking border-[var(--brand-bright)] bg-[var(--brand-dim)]"
        : "hero-mic-shell border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] hover:shadow-[var(--shadow-brand)] hover:scale-[1.04]";

  const transcriptText =
    effectiveStatus === "listening"
      ? transcriptDisplay.text || transcript || t.voicePanel.waiting
      : effectiveStatus === "speaking"
        ? pendingResponseText || lastResponse
        : transcriptDisplay.text || transcript || "";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Voice control
          </p>
          <p className="text-[16px] font-semibold text-[var(--text-primary)]">{t.voicePanel.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={effectiveStatus} />
          <LanguageSelector />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background:
                scanStatus === "ready"
                  ? "#00e07a"
                  : scanStatus === "scanning"
                    ? "#fbbf24"
                    : scanStatus === "error"
                      ? "#ff4d6a"
                      : "#4a4c6a",
              animation: scanStatus === "scanning" ? "pulse 1s ease infinite" : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "var(--text-secondary)",
            }}
          >
            {scanStatus === "scanning" && "Scanning page..."}
            {scanStatus === "ready" && elementCount > 0 && `${elementCount} elements detected`}
            {scanStatus === "ready" && elementCount === 0 && "No elements found"}
            {scanStatus === "idle" && "Scanner idle"}
            {scanStatus === "error" && "Scanner error"}
          </span>
        </div>

        <button
          onClick={scanDOM}
          style={{
            fontSize: "10px",
            padding: "3px 8px",
            background: "transparent",
            border: "1px solid var(--border-default)",
            borderRadius: "4px",
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "var(--brand)";
            e.target.style.color = "var(--brand-bright)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "var(--border-default)";
            e.target.style.color = "var(--text-muted)";
          }}
          type="button"
        >
          Rescan
        </button>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative inline-flex">
            <button
              id="mic-btn"
              type="button"
              onClick={toggleListening}
              disabled={!isSupported || isDemoRunning}
              aria-label={isListening ? t.status.listening : t.voicePanel.clickToStart}
              className={`relative flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 md:h-[88px] md:w-[88px] ${buttonStateClass}`}
            >
              {effectiveStatus === "listening" ? (
                <span className="wave-active flex h-[24px] items-end gap-[4px]" aria-hidden="true">
                  {waveformBars.map((bar, index) => (
                    <span
                      key={`${bar.height}-${index}`}
                      className="wave-bar rounded-[2px] bg-[var(--success)]"
                      style={{
                        width: "5px",
                        height: `${bar.height}px`,
                        animationDelay: bar.delay,
                        transformOrigin: "center bottom",
                      }}
                    />
                  ))}
                </span>
              ) : effectiveStatus === "speaking" ? (
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--brand-bright)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 9v6h4l5 4V5L9 9H5Z" />
                  <path d="M18 9a4 4 0 0 1 0 6" />
                  <path d="M20.5 6.5a7.5 7.5 0 0 1 0 11" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a7 7 0 0 1-14 0" />
                  <path d="M12 18v3" />
                </svg>
              )}
            </button>
          </div>

          <p className="font-mono-ui text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {effectiveStatus === "listening"
              ? t.voicePanel.listening
              : effectiveStatus === "speaking"
                ? t.voicePanel.speaking
                : effectiveStatus === "processing"
                  ? t.voicePanel.processing
                  : t.voicePanel.clickToStart}
          </p>

          <div
            className={`w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 transition-all duration-200 ${
              effectiveStatus === "idle" ? "max-h-0 border-transparent px-0 py-0 opacity-0" : "max-h-[120px] opacity-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-center">
              {effectiveStatus === "speaking" ? (
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--brand-bright)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--brand-bright)]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-[var(--brand-bright)]" />
                </span>
              ) : null}
              <p className="font-mono-ui text-[14px] text-[var(--text-secondary)]">
                {effectiveStatus === "listening" ? `${transcriptText}${transcriptText ? " ▊" : ""}` : transcriptText}
              </p>
            </div>
          </div>

          {supportError ? (
            <div className="w-full rounded-[var(--radius-md)] border border-[var(--error)] bg-[rgba(255,77,106,0.08)] px-4 py-3 text-[13px] text-[var(--error)]">
              {supportError}
            </div>
          ) : null}
        </div>

        <div className="response-card rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <p className="mb-2 font-mono-ui text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            <span className="text-[var(--brand-bright)]">{"\u203a"} </span>
            {lastCommand || "Voice response"}
          </p>
          <p className="text-[16px] leading-7 text-[var(--text-primary)]">{lastResponse}</p>
          {lastAction ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(0,212,255,0.25)] bg-[var(--accent-dim)] px-3 py-1.5 font-mono-ui text-[12px] text-[var(--accent)]">
              <span>{"\u2713"}</span>
              <span>{lastAction}</span>
            </div>
          ) : null}
        </div>

        <div className="border-y border-[var(--border-subtle)] px-1 py-4">
          <Transcript
            transcript={transcriptDisplay.text || transcript}
            isInterim={!transcriptDisplay.isFinal && Boolean(transcriptDisplay.text)}
            status={effectiveStatus}
            pendingResponseText={pendingResponseText}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ResponseLog simulateCommand={processCommand} chipsDisabled={isDemoRunning} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px 16px 16px",
          borderTop: "1px solid var(--border-subtle)",
          width: "100%",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <button
          className="sff-trigger-btn"
          onClick={() => setSffOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "11px 16px",
            background: "var(--brand)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
          }}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.9" />
            <rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.9" />
            <rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.9" />
            <rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.45" />
          </svg>
          Fill a Form
        </button>

        <button
          onClick={handleRunDemo}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "11px 16px",
            background: "transparent",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
          }}
          type="button"
        >
          Run Demo
        </button>
      </div>

      <SmartFormFiller
        isOpen={sffOpen}
        onClose={() => setSffOpen(false)}
        speakOnboarding={speakOnboarding}
        transcript={transcript}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
      />
    </aside>
  );
};

export default VoicePanel;
