import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import { LANGUAGES, VOICE_PREVIEWS, getActiveVoice } from "../utils/languages";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const ONBOARDING_VOICE_ID = "en-US-natalie";
const FEMALE_FALLBACK_VOICES = ["Samantha", "Karen", "Zira", "Google UK English Female"];

const STEP_TEXT = {
  1: "Welcome to SpeakSite. I am Natalie, your voice assistant. This app lets you navigate a website entirely using your voice. Let me show you how it works.",
  2: "You can say things like: go to signup page, fill email with your email address, or submit form. It is that simple.",
  3: "Now choose your preferred language and voice. Click any voice to hear a preview. When you are ready, click Start.",
  start:
    "You are all set. Click the microphone button and start talking. I will guide you every step.",
};

const STEP_META = {
  1: {
    title: "Meet Natalie",
    description: STEP_TEXT[1],
  },
  2: {
    title: "Speak Naturally",
    description: STEP_TEXT[2],
  },
  3: {
    title: "Pick Your Voice",
    description: STEP_TEXT[3],
  },
};

const VoiceOnboarding = () => {
  const {
    onboardingComplete,
    selectedLanguage,
    selectedGender,
    setOnboardingComplete,
    setSelectedLanguage,
    updateGender,
    setVoiceStatus,
  } = useVoiceContext();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [isStepAnimating, setIsStepAnimating] = useState(false);
  const [previewKey, setPreviewKey] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const currentAudioRef = useRef(null);
  const timeoutRef = useRef(null);
  const activeStepRef = useRef(1);

  useEffect(() => {
    activeStepRef.current = currentStep;
  }, [currentStep]);

  const clearCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    clearCurrentAudio();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPreviewKey("");
    setVoiceStatus("idle");
  }, [clearCurrentAudio, setVoiceStatus]);

  const pickFemaleFallbackVoice = useCallback(() => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return (
      voices.find((voice) => FEMALE_FALLBACK_VOICES.includes(voice.name)) ||
      voices.find((voice) => voice.lang?.startsWith("en") && /female|woman|zira|samantha|karen/i.test(voice.name)) ||
      voices.find((voice) => voice.lang?.startsWith("en")) ||
      null
    );
  }, []);

  const speakFallback = useCallback(
    (text, onComplete) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      const preferredVoice = pickFemaleFallbackVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setVoiceStatus("idle");
        if (onComplete) {
          onComplete();
        }
      };

      utterance.onerror = () => {
        setVoiceStatus("idle");
        if (onComplete) {
          onComplete();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [pickFemaleFallbackVoice, setVoiceStatus],
  );

  const speakOnboarding = useCallback(
    async (text, onComplete) => {
      const trimmedText = text?.trim();
      if (!trimmedText) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      clearCurrentAudio();
      console.log("[SpeakSite Onboarding] Speaking:", trimmedText.substring(0, 40));
      setVoiceStatus("speaking");

      try {
        const response = await fetch(`${API_BASE_URL}/speak`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmedText,
            voice_id: ONBOARDING_VOICE_ID,
          }),
        });

        if (!response.ok) {
          throw new Error(`Murf HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error("Empty audio");
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.load();

        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          setVoiceStatus("idle");
          if (onComplete) {
            onComplete();
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          speakFallback(trimmedText, onComplete);
        };

        await audio.play();
        return;
      } catch (error) {
        console.error("[SpeakSite Onboarding] Error:", error);
        speakFallback(trimmedText, onComplete);
      }
    },
    [clearCurrentAudio, setVoiceStatus, speakFallback],
  );

  const previewVoice = useCallback(
    async (text, voiceId, onComplete) => {
      const trimmedText = text?.trim();
      if (!trimmedText) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      clearCurrentAudio();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      try {
        const response = await fetch(`${API_BASE_URL}/speak`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmedText,
            voice_id: voiceId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Murf HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error("Preview audio was empty");
        }

        const audio = new Audio(URL.createObjectURL(blob));
        currentAudioRef.current = audio;

        audio.onended = () => {
          currentAudioRef.current = null;
          if (onComplete) {
            onComplete();
          }
        };

        await new Promise((resolve, reject) => {
          audio.onerror = () => {
            currentAudioRef.current = null;
            reject(new Error("Preview audio playback failed"));
          };

          audio
            .play()
            .then(() => resolve())
            .catch((playbackError) => {
              currentAudioRef.current = null;
              reject(playbackError);
            });
        });
        return;
      } catch (error) {
        const utterance = new SpeechSynthesisUtterance(trimmedText);
        const fallbackVoice =
          (window.speechSynthesis?.getVoices?.() || []).find((voice) => voice.lang === voiceId.split("-").slice(0, 2).join("-")) ||
          null;
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
        }
        utterance.lang = voiceId.split("-").slice(0, 2).join("-");
        utterance.onend = () => {
          if (onComplete) {
            onComplete();
          }
        };
        utterance.onerror = () => {
          if (onComplete) {
            onComplete();
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    },
    [clearCurrentAudio],
  );

  useEffect(() => {
    const storedValue = window.sessionStorage.getItem("onboarding_complete");

    if (storedValue === "true") {
      setOnboardingComplete(true);
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setHasCheckedSession(true);
  }, [setOnboardingComplete]);

  useEffect(() => {
    if (!hasCheckedSession || !isVisible || onboardingComplete || isClosing || !userHasInteracted) {
      return undefined;
    }

    const stepText = STEP_TEXT[currentStep];
    if (!stepText) {
      return undefined;
    }

    setIsStepAnimating(true);
    timeoutRef.current = window.setTimeout(() => {
      void speakOnboarding(stepText, () => {
        if (currentStep < 3 && activeStepRef.current === currentStep) {
          timeoutRef.current = window.setTimeout(() => {
            setCurrentStep((previousStep) => previousStep + 1);
          }, 500);
        }
      });
      timeoutRef.current = null;
    }, 300);

    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech, currentStep, hasCheckedSession, isClosing, isVisible, onboardingComplete, speakOnboarding, userHasInteracted]);

  useEffect(() => {
    const animationTimeout = window.setTimeout(() => {
      setIsStepAnimating(false);
    }, 220);

    return () => {
      window.clearTimeout(animationTimeout);
    };
  }, [currentStep]);

  const closeOverlay = useCallback(() => {
    cancelSpeech();
    setIsClosing(true);
    window.sessionStorage.setItem("onboarding_complete", "true");
    window.setTimeout(() => {
      setOnboardingComplete(true);
      setIsVisible(false);
      setVoiceStatus("idle");
    }, 250);
  }, [cancelSpeech, setOnboardingComplete, setVoiceStatus]);

  const handleStart = async () => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    cancelSpeech();
    await speakOnboarding(STEP_TEXT.start, closeOverlay);
  };

  const handleSkip = () => {
    closeOverlay();
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage({
      ...language,
      selectedGender,
    });
  };

  const handleVoiceSelect = async (event, language, gender) => {
    event.stopPropagation();
    const activeVoice = getActiveVoice(language, gender);
    setSelectedLanguage({
      ...language,
      selectedGender: gender,
    });
    updateGender(gender);
    setPreviewKey(`${language.code}-${gender}`);
    await previewVoice(VOICE_PREVIEWS[language.code][gender], activeVoice.voiceId, () => setPreviewKey(""));
  };

  if (!hasCheckedSession || onboardingComplete || !isVisible) {
    return null;
  }

  const stepData = STEP_META[currentStep];
  const progressWidth = `${Math.min(currentStep, 3) * 33.3333}%`;

  return (
    <div className={`onboarding-overlay ${isClosing ? "is-closing" : ""}`}>
      <div className="onboarding-card">
        <style>{`
          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(108,71,255,0.5); }
            70% { box-shadow: 0 0 0 20px rgba(108,71,255,0); }
            100% { box-shadow: 0 0 0 0 rgba(108,71,255,0); }
          }
        `}</style>

        {!userHasInteracted ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                cursor: "pointer",
                animation: "pulse-ring 2s ease infinite",
                boxShadow: "0 0 0 0 rgba(108,71,255,0.5)",
              }}
              onClick={() => setUserHasInteracted(true)}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
                <path
                  d="M5 10a7 7 0 0 0 14 0"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "10px",
                letterSpacing: "-0.4px",
              }}
            >
              Welcome to SpeakSite
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                marginBottom: "28px",
                maxWidth: "280px",
              }}
            >
              Click the mic to start your voice experience. Make sure your sound is on.
            </p>

            <button
              onClick={() => setUserHasInteracted(true)}
              style={{
                padding: "13px 32px",
                background: "var(--brand)",
                border: "none",
                borderRadius: "var(--radius-full)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                letterSpacing: "-0.2px",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "var(--brand-bright)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "var(--brand)";
                e.target.style.transform = "translateY(0)";
              }}
              type="button"
            >
              Start Voice Experience
            </button>

            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "14px",
              }}
            >
              🔊 Make sure your volume is turned up
            </p>
          </div>
        ) : (
          <>
            <div className="onboarding-progress-track">
              <div className="onboarding-progress-fill" style={{ width: progressWidth }} />
            </div>

            <div className={`onboarding-step-shell ${isStepAnimating ? "is-animating" : ""}`} key={currentStep}>
              <div className="onboarding-step-icon" aria-hidden="true">
                {currentStep === 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                    <path d="M19 11a7 7 0 0 1-14 0" />
                    <path d="M12 18v3" />
                  </svg>
                ) : currentStep === 2 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 12h4l2-3 4 6 2-3h4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h10" />
                  </svg>
                )}
              </div>

              <h2 className="onboarding-title">{stepData.title}</h2>
              <p className="onboarding-description">{stepData.description}</p>

              {currentStep === 2 ? (
                <div className="onboarding-command-list">
                  <div className="onboarding-command-card">
                    <span className="onboarding-command-kicker">NAV</span>
                    <span className="onboarding-command-copy">Go to signup page</span>
                  </div>
                  <div className="onboarding-command-card">
                    <span className="onboarding-command-kicker">FILL</span>
                    <span className="onboarding-command-copy">Fill email with your email address</span>
                  </div>
                  <div className="onboarding-command-card">
                    <span className="onboarding-command-kicker">SEND</span>
                    <span className="onboarding-command-copy">Submit form</span>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className="onboarding-voice-grid">
                    {LANGUAGES.map((language) => {
                      const isSelected = language.code === selectedLanguage.code;
                      const languageGender = isSelected ? selectedLanguage.selectedGender || selectedGender : selectedGender;

                      return (
                        <div
                          key={language.code}
                          onClick={() => handleLanguageSelect(language)}
                          className={`onboarding-voice-card ${isSelected ? "is-selected" : ""}`}
                        >
                          <div className="onboarding-voice-card-header">
                            <span className="onboarding-voice-flag">{language.flag}</span>
                            <div className="onboarding-voice-text">
                              <span className="onboarding-voice-language">{language.name}</span>
                              <span className="onboarding-voice-name">{getActiveVoice(language, languageGender).label}</span>
                            </div>
                          </div>

                          <div className="onboarding-voice-actions">
                            {["female", "male"].map((gender) => {
                              const voice = language.voices[gender];
                              const isGenderSelected = isSelected && languageGender === gender;
                              const isPreviewing = previewKey === `${language.code}-${gender}`;

                              return (
                                <button
                                  key={gender}
                                  type="button"
                                  onClick={(event) => handleVoiceSelect(event, language, gender)}
                                  className={`onboarding-voice-option ${
                                    isGenderSelected ? "is-selected" : ""
                                  } ${isPreviewing ? "is-previewing" : ""}`}
                                >
                                  <span>{gender === "female" ? "Female" : "Male"}</span>
                                  <span>{voice.label}</span>
                                  {isPreviewing ? (
                                    <span className="mini-wave" aria-hidden="true">
                                      <span />
                                      <span />
                                      <span />
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" onClick={handleStart} className="onboarding-start-button" disabled={isStarting}>
                    {isStarting ? (
                      <span className="button-inline-loader">
                        <span className="button-spinner" />
                        <span>Starting...</span>
                      </span>
                    ) : (
                      "Start"
                    )}
                  </button>

                  <button type="button" onClick={handleSkip} className="onboarding-skip-button">
                    Skip
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleSkip} className="onboarding-skip-button compact">
                  Skip intro
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceOnboarding;
