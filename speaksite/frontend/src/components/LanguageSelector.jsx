import { useEffect, useRef, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import useVoiceOutput from "../hooks/useVoiceOutput";
import { LANGUAGE_CONFIRMATIONS, LANGUAGES, VOICE_PREVIEWS, getActiveVoice } from "../utils/languages";

const LanguageSelector = () => {
  const { selectedLanguage, selectedGender, setSelectedLanguage, updateGender, addToLog, t } = useVoiceContext();
  const { speak, isSpeaking } = useVoiceOutput();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCode, setHoveredCode] = useState("");
  const [previewKey, setPreviewKey] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const handleSelect = async (language) => {
    setSelectedLanguage({
      ...language,
      selectedGender,
    });
    setIsOpen(false);
    addToLog(`${t.logs.langSwitched} ${language.flag} ${language.name}`, "system");
    await speak(LANGUAGE_CONFIRMATIONS[language.code], undefined, {
      voiceId: getActiveVoice(language, selectedGender).voiceId,
      lang: language.code,
    });
  };

  const handleGenderSelect = async (event, language, gender) => {
    event.stopPropagation();
    const activeVoice = getActiveVoice(language, gender);
    setSelectedLanguage({
      ...language,
      selectedGender: gender,
    });
    updateGender(gender);
    addToLog(`Voice -> ${language.flag} ${activeVoice.label} ${gender === "female" ? "\u2640" : "\u2642"}`, "system");
    setPreviewKey(`${language.code}-${gender}`);
    await speak(VOICE_PREVIEWS[language.code][gender], () => setPreviewKey(""), {
      voiceId: activeVoice.voiceId,
      lang: language.code,
    });
  };

  const activeVoice = getActiveVoice(selectedLanguage, selectedLanguage.selectedGender || selectedGender);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
          isOpen
            ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--text-primary)]"
            : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`}
        aria-label={t.languageSelector.chooseLanguage}
      >
        <span>{selectedLanguage.flag}</span>
        <span className="hidden sm:inline">{selectedLanguage.name}</span>
        <span className="font-mono-ui hidden text-[10px] text-[var(--text-muted)] xl:inline">
          {activeVoice.label}
        </span>
      </button>

      {isOpen ? (
        <div className="page-fade absolute right-0 top-[calc(100%+8px)] z-50 min-w-[280px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-lg)]">
          {LANGUAGES.map((language) => {
            const isActive = language.code === selectedLanguage.code;
            const isExpanded = isActive || hoveredCode === language.code;
            const languageGender = isActive ? selectedLanguage.selectedGender || selectedGender : selectedGender;

            return (
              <div
                key={language.code}
                onMouseEnter={() => setHoveredCode(language.code)}
                onMouseLeave={() => setHoveredCode("")}
                className={`rounded-[var(--radius-md)] border px-3 py-3 transition ${
                  isActive
                    ? "border-[var(--brand)] bg-[var(--brand-dim)]"
                    : "border-transparent bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <button type="button" onClick={() => handleSelect(language)} className="flex w-full items-center gap-3 text-left">
                  <span className="text-[18px]">{language.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[var(--text-primary)]">{language.name}</span>
                    <span className="font-mono-ui block text-[10px] text-[var(--text-muted)]">
                      {getActiveVoice(language, languageGender).label}
                    </span>
                  </span>
                </button>

                {isExpanded ? (
                  <div className="mt-3 grid gap-2">
                    {["female", "male"].map((gender) => {
                      const voice = language.voices[gender];
                      const isGenderSelected = isActive && languageGender === gender;
                      const isPreviewing = previewKey === `${language.code}-${gender}` && isSpeaking;

                      return (
                        <button
                          key={gender}
                          type="button"
                          onClick={(event) => handleGenderSelect(event, language, gender)}
                          className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-[12px] transition ${
                            isPreviewing
                              ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--text-primary)]"
                              : isGenderSelected
                                ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--text-primary)]"
                                : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{gender === "female" ? "Female" : "Male"}</span>
                            <span className="font-mono-ui text-[10px] text-[var(--text-muted)]">{voice.label}</span>
                          </span>
                          <span>{isPreviewing ? "Playing" : isGenderSelected ? "\u2713" : "Preview"}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default LanguageSelector;
