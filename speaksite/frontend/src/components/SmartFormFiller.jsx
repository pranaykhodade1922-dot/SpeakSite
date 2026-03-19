import { useCallback, useEffect, useRef } from "react";
import { useFormFiller } from "../hooks/useFormFiller";
import FormFieldCard from "./FormFieldCard";
import "../styles/SmartFormFiller.css";

export default function SmartFormFiller({
  isOpen,
  onClose,
  speakOnboarding,
  transcript,
  isListening,
  startListening,
  stopListening,
}) {
  const {
    formData,
    fields,
    currentIndex,
    currentField,
    filledValues,
    status,
    errorMsg,
    activeTab,
    htmlInput,
    urlInput,
    dragOver,
    progress,
    totalFields,
    setActiveTab,
    setHtmlInput,
    setUrlInput,
    setDragOver,
    setStatus,
    loadFromHTML,
    loadFromURL,
    fillCurrentField,
    goToNextField,
    goToFieldByName,
    editField,
    reset,
  } = useFormFiller();

  const lastTranscript = useRef("");

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen || status !== "filling") {
      return;
    }
    if (!currentField?.voice_prompt) {
      return;
    }
    const text = currentField.voice_prompt;
    speakOnboarding(text, () => {
      startListening();
    });
  }, [currentIndex, currentField, isOpen, speakOnboarding, startListening, status]);

  useEffect(() => {
    if (!isOpen || !transcript) {
      return;
    }
    if (transcript === lastTranscript.current) {
      return;
    }
    if (status !== "filling" && status !== "confirming") {
      return;
    }
    lastTranscript.current = transcript;
  }, [isOpen, transcript, status]);

  useEffect(() => {
    if (!isOpen || isListening || status !== "filling" || !lastTranscript.current) {
      return;
    }

    const speech = lastTranscript.current;
    lastTranscript.current = "";

    if (speech.toLowerCase().includes("skip")) {
      goToNextField();
      return;
    }

    fillCurrentField(speech).then((mapped) => {
      if (!mapped) {
        return;
      }
      if (mapped.needs_clarification) {
        speakOnboarding(mapped.clarification_prompt, () => {
          startListening();
        });
        return;
      }
      const confirmText = `Got it. ${mapped.display}.`;
      speakOnboarding(confirmText, () => {
        window.setTimeout(() => goToNextField(), 300);
      });
    });
  }, [fillCurrentField, goToNextField, isListening, isOpen, speakOnboarding, startListening, status]);

  useEffect(() => {
    if (!isOpen || status !== "confirming") {
      return;
    }
    const filled = Object.values(filledValues);
    const summary = filled
      .slice(0, 4)
      .map((item) => `${item.field.label}: ${item.display}`)
      .join(". ");
    const extra = filled.length > 4 ? ` and ${filled.length - 4} more fields.` : ".";
    speakOnboarding(
      `You filled ${filled.length} fields. ${summary}${extra} Say confirm to submit or say edit followed by the field name to change it.`,
      () => startListening(),
    );
  }, [filledValues, isOpen, speakOnboarding, startListening, status]);

  useEffect(() => {
    if (!isOpen || status !== "confirming" || isListening || !lastTranscript.current) {
      return;
    }

    const speech = lastTranscript.current.toLowerCase();
    lastTranscript.current = "";

    if (speech.includes("confirm") || speech.includes("submit")) {
      setStatus("done");
      speakOnboarding("Form submitted. All done!");
    } else if (speech.includes("edit")) {
      const fieldName = speech.replace("edit", "").trim();
      goToFieldByName(fieldName);
    } else {
      startListening();
    }
  }, [goToFieldByName, isListening, isOpen, setStatus, speakOnboarding, startListening, status]);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => setHtmlInput(loadEvent.target.result);
      reader.readAsText(file);
    },
    [setDragOver, setHtmlInput],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sff-overlay">
      <div className="sff-panel">
        <div className="sff-header">
          <div className="sff-header-left">
            <span className="sff-logo-icon">⊞</span>
            <span className="sff-title">Smart Form Filler</span>
          </div>
          <button
            className="sff-close"
            onClick={() => {
              stopListening();
              reset();
              onClose();
            }}
            type="button"
          >
            ✕
          </button>
        </div>

        {status === "idle" && (
          <div className="sff-input-section">
            <div className="sff-tabs">
              <button
                className={`sff-tab ${activeTab === "html" ? "active" : ""}`}
                onClick={() => setActiveTab("html")}
                type="button"
              >
                Upload HTML
              </button>
              <button
                className={`sff-tab ${activeTab === "url" ? "active" : ""}`}
                onClick={() => setActiveTab("url")}
                type="button"
              >
                From URL
              </button>
            </div>

            {activeTab === "html" && (
              <div className="sff-tab-content">
                <div
                  className={`sff-dropzone ${dragOver ? "dragover" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <span className="sff-drop-icon">⊕</span>
                  <span className="sff-drop-text">Drop .html file here or paste below</span>
                </div>
                <textarea
                  className="sff-html-input"
                  placeholder="Paste form HTML here..."
                  value={htmlInput}
                  onChange={(event) => setHtmlInput(event.target.value)}
                  rows={8}
                />
                <button
                  className="sff-submit-btn"
                  disabled={!htmlInput.trim()}
                  onClick={() => loadFromHTML(htmlInput)}
                  type="button"
                >
                  Parse Form →
                </button>
              </div>
            )}

            {activeTab === "url" && (
              <div className="sff-tab-content">
                <div className="sff-url-hint">
                  Enter any public form URL. Our server will fetch and parse it for you.
                </div>
                <input
                  className="sff-url-input"
                  type="url"
                  placeholder="https://example.com/contact"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                />
                <button
                  className="sff-submit-btn"
                  disabled={!urlInput.trim()}
                  onClick={() => loadFromURL(urlInput)}
                  type="button"
                >
                  Load Form →
                </button>
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <div className="sff-loading">
            <div className="sff-spinner" />
            <p>Parsing form fields with AI...</p>
          </div>
        )}

        {status === "error" && (
          <div className="sff-error-state">
            <span className="sff-error-icon">⚠</span>
            <p>{errorMsg}</p>
            <button className="sff-retry-btn" onClick={reset} type="button">
              Try Again
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="sff-ready-state">
            <div className="sff-form-meta">
              <span className="sff-form-title">{formData?.page_title || "Form detected"}</span>
              <span className="sff-field-count">{totalFields} fields found</span>
            </div>
            <div className="sff-field-preview">
              {fields.slice(0, 5).map((field, index) => (
                <div key={`${field.name}-${index}`} className="sff-preview-pill">
                  {field.label || field.name}
                </div>
              ))}
              {fields.length > 5 ? (
                <div className="sff-preview-pill muted">+{fields.length - 5} more</div>
              ) : null}
            </div>
            <button
              className="sff-start-btn"
              onClick={() => {
                speakOnboarding(
                  `Great. I found ${totalFields} fields. Let us fill them together. I will ask you each one.`,
                  () => {
                    setStatus("filling");
                  },
                );
              }}
              type="button"
            >
              Start Voice Filling
            </button>
          </div>
        )}

        {status === "filling" && currentField ? (
          <div className="sff-filling-state">
            <div className="sff-progress-track">
              <div className="sff-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="sff-progress-label">
              Field {currentIndex + 1} of {totalFields}
            </div>

            <div className="sff-current-field">
              <div className="sff-field-type-badge">{currentField.type}</div>
              <div className="sff-field-label">{currentField.label}</div>
              {currentField.voice_prompt ? (
                <div className="sff-voice-prompt">"{currentField.voice_prompt}"</div>
              ) : null}
              {currentField.options?.length > 0 ? (
                <div className="sff-options-row">
                  {currentField.options.slice(0, 4).map((option, index) => (
                    <span key={`${option.value}-${index}`} className="sff-option-chip">
                      {option.label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className={`sff-mic-status ${isListening ? "listening" : ""}`}>
                <span className="sff-mic-dot" />
                {isListening ? "Listening..." : "Processing..."}
              </div>
            </div>

            <div className="sff-filled-list">
              {Object.entries(filledValues)
                .slice(-3)
                .map(([idx, item]) => (
                  <FormFieldCard
                    key={idx}
                    field={item.field}
                    value={item.display}
                    index={Number(idx)}
                    onEdit={editField}
                  />
                ))}
            </div>
          </div>
        ) : null}

        {status === "confirming" && (
          <div className="sff-confirming-state">
            <div className="sff-confirm-header">All {totalFields} fields filled</div>
            <div className="sff-all-fields custom-scrollbar">
              {Object.entries(filledValues).map(([idx, item]) => (
                <FormFieldCard
                  key={idx}
                  field={item.field}
                  value={item.display}
                  index={Number(idx)}
                  onEdit={(index) => {
                    editField(index);
                    setStatus("filling");
                  }}
                />
              ))}
            </div>
            <div className="sff-confirm-actions">
              <button className="sff-confirm-btn" onClick={() => setStatus("done")} type="button">
                Submit Form
              </button>
              <div className="sff-voice-hint">or say "confirm" to submit</div>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="sff-done-state">
            <div className="sff-done-icon">✓</div>
            <div className="sff-done-title">Form Submitted!</div>
            <div className="sff-done-subtitle">
              {Object.keys(filledValues).length} fields filled by voice
            </div>
            <button className="sff-new-btn" onClick={reset} type="button">
              Fill Another Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
