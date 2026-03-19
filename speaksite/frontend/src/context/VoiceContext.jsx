import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { sharedAudioCacheRef } from "../hooks/useVoiceOutput";
import { DEFAULT_LANGUAGE, getActiveVoice } from "../utils/languages";
import translations from "../utils/translations";

const VoiceContext = createContext(null);

const initialFormData = {
  name: "",
  email: "",
  message: "",
};

export const VoiceProvider = ({ children }) => {
  const [activePage, setActivePage] = useState("home");
  const [formData, setFormData] = useState(initialFormData);
  const [transcript, setTranscript] = useState("");
  const [responseLog, setResponseLog] = useState([]);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastUpdatedField, setLastUpdatedField] = useState(null);
  const [selectedLanguage, setSelectedLanguageState] = useState(DEFAULT_LANGUAGE);
  const [selectedGender, setSelectedGender] = useState("female");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);
  const [theme, setTheme] = useState(() => localStorage.getItem("speaksite-theme") || "dark");
  const [triggerDemo, setTriggerDemo] = useState(null);

  const t = translations[selectedLanguage?.code] || translations["en-US"];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = selectedLanguage?.code || "en-US";
  }, [selectedLanguage]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("speaksite-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const navigateTo = (page) => {
    setActivePage(page);
    setIsSubmitted(false);
  };

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
    setLastUpdatedField(field);
    setIsSubmitted(false);
    window.clearTimeout(updateField.highlightTimeout);
    updateField.highlightTimeout = window.setTimeout(() => {
      setLastUpdatedField(null);
    }, 2000);
  };

  const submitForm = () => {
    setIsSubmitted(true);
  };

  const addToLog = (text, type = "system") => {
    setResponseLog((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        type,
      },
    ]);
  };

  const switchLanguage = (nextLanguage) => {
    document.body.classList.add("lang-transitioning");

    setSelectedLanguageState((previousLanguage) => {
      const resolvedLanguage = typeof nextLanguage === "function" ? nextLanguage(previousLanguage) : nextLanguage;
      const effectiveGender = resolvedLanguage.selectedGender || selectedGender;
      const activeVoice = getActiveVoice(resolvedLanguage, effectiveGender);
      return {
        ...resolvedLanguage,
        lang: resolvedLanguage.lang || resolvedLanguage.code,
        selectedGender: effectiveGender,
        voiceId: activeVoice.voiceId,
        label: `${activeVoice.label} (${resolvedLanguage.code.split("-")[1]})`,
      };
    });

    window.setTimeout(() => {
      document.body.classList.remove("lang-transitioning");
    }, 300);
  };

  const updateGender = (gender) => {
    setSelectedGender(gender);
    setSelectedLanguageState((previousLanguage) => {
      const activeVoice = getActiveVoice(previousLanguage, gender);
      return {
        ...previousLanguage,
        lang: previousLanguage.lang || previousLanguage.code,
        selectedGender: gender,
        voiceId: activeVoice.voiceId,
        label: `${activeVoice.label} (${previousLanguage.code.split("-")[1]})`,
      };
    });
  };

  const value = useMemo(
    () => ({
      activePage,
      formData,
      transcript,
      responseLog,
      voiceStatus,
      isSubmitted,
      lastUpdatedField,
      selectedLanguage,
      selectedGender,
      onboardingComplete,
      isDemoRunning,
      demoStep,
      theme,
      triggerDemo,
      // WHY: Exposing the shared cache ref makes performance tooling and preloading
      // consume the exact same audio cache instead of accidentally creating a second one.
      audioCacheRef: sharedAudioCacheRef,
      t,
      navigateTo,
      updateField,
      submitForm,
      addToLog,
      toggleTheme,
      setTranscript,
      setVoiceStatus,
      setSelectedLanguage: switchLanguage,
      switchLanguage,
      updateGender,
      setSelectedGender,
      setOnboardingComplete,
      setIsDemoRunning,
      setDemoStep,
      setTriggerDemo,
    }),
    [
      activePage,
      formData,
      transcript,
      responseLog,
      voiceStatus,
      isSubmitted,
      lastUpdatedField,
      selectedLanguage,
      selectedGender,
      onboardingComplete,
      isDemoRunning,
      demoStep,
      theme,
      triggerDemo,
      t,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoiceContext = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoiceContext must be used within a VoiceProvider");
  }
  return context;
};
