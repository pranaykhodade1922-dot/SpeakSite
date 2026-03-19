import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const sharedAudioCacheRef = { current: new Map() };
const sharedCacheHitsRef = { current: 0 };
const sharedCacheMissesRef = { current: 0 };
const prewarmStartedRef = { current: false };

const PREWARM_TEXTS = [
  "Done. Navigating now.",
  "Got it.",
  "Form submitted successfully.",
  "I did not understand that. Please try again.",
  "Navigating to the signup page.",
  "Navigating to the contact page.",
  "Navigating to the home page.",
  "Field filled successfully.",
  "Scrolling down.",
  "Scrolling up.",
];

const buildCacheKey = (voiceId, text) => `${voiceId}::${text.trim()}`;

const fetchAndCacheAudio = async (text, voiceId) => {
  const trimmedText = text?.trim();
  if (!trimmedText) {
    throw new Error("Missing text");
  }

  const response = await fetch(`${API_BASE_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: trimmedText,
      voice_id: voiceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("Empty audio blob");
  }

  const url = URL.createObjectURL(blob);
  sharedAudioCacheRef.current.set(buildCacheKey(voiceId, trimmedText), url);
  return url;
};

export const preloadAudioPhrase = async (text, voiceId) => {
  const trimmedText = text?.trim();
  if (!trimmedText) {
    return false;
  }

  const cacheKey = buildCacheKey(voiceId, trimmedText);
  if (sharedAudioCacheRef.current.has(cacheKey)) {
    return true;
  }

  try {
    await fetchAndCacheAudio(trimmedText, voiceId);
    return true;
  } catch (error) {
    console.log("[SpeakSite Preload] Failed for:", trimmedText.substring(0, 30), error);
    return false;
  }
};

const useVoiceOutput = () => {
  const { selectedLanguage, setVoiceStatus } = useVoiceContext();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [pendingResponseText, setPendingResponseText] = useState("");
  const currentAudioRef = useRef(null);

  const cancelSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPendingResponseText("");
    setIsSpeaking(false);
    setVoiceStatus("idle");
  }, [setVoiceStatus]);

  useEffect(() => cancelSpeech, [cancelSpeech]);

  const fallbackSpeak = useCallback(
    (text, onComplete, overrideLanguage = selectedLanguage) => {
      console.log("[SpeakSite] Murf failed, using browser fallback");
      cancelSpeech();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = overrideLanguage.lang;
      setPendingResponseText(text);
      setIsSpeaking(true);
      setVoiceStatus("speaking");

      utterance.onend = () => {
        setPendingResponseText("");
        setIsSpeaking(false);
        setVoiceStatus("idle");
        if (onComplete) {
          onComplete();
        }
      };

      utterance.onerror = () => {
        setPendingResponseText("");
        setIsSpeaking(false);
        setVoiceStatus("idle");
        if (onComplete) {
          onComplete();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [cancelSpeech, selectedLanguage, setVoiceStatus],
  );

  const prewarmCache = useCallback(async () => {
    const voiceId = "en-US-natalie";

    for (const text of PREWARM_TEXTS) {
      const cacheKey = buildCacheKey(voiceId, text);
      if (sharedAudioCacheRef.current.has(cacheKey)) {
        continue;
      }

      try {
        await fetchAndCacheAudio(text, voiceId);
        console.log("[SpeakSite] Pre-warmed:", text);
      } catch (error) {
        // Best effort only.
      }

      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
  }, []);

  useEffect(() => {
    if (prewarmStartedRef.current) {
      return undefined;
    }

    prewarmStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void prewarmCache();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [prewarmCache]);

  const speak = useCallback(
    async (text, onComplete, overrideVoice = selectedLanguage) => {
      const trimmedText = text?.trim();
      if (!trimmedText) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const startTime = performance.now();
      const voiceId = overrideVoice?.voiceId || selectedLanguage?.voiceId || "en-US-natalie";
      const cacheKey = buildCacheKey(voiceId, trimmedText);

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();

      setError(null);

      const playAudio = async (audioUrl, sourceLabel) => {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        setPendingResponseText(trimmedText);
        setIsSpeaking(true);
        setVoiceStatus("speaking");

        audio.onplay = () => {
          const latency = Math.round(performance.now() - startTime);
          console.log(`[SpeakSite Perf] Voice latency: ${latency}ms ${sourceLabel}`);
        };

        audio.onended = () => {
          currentAudioRef.current = null;
          setPendingResponseText("");
          setIsSpeaking(false);
          setVoiceStatus("idle");
          if (onComplete) {
            onComplete();
          }
        };

        await new Promise((resolve, reject) => {
          audio.onerror = () => {
            currentAudioRef.current = null;
            reject(new Error("Audio playback failed"));
          };

          audio
            .play()
            .then(() => resolve())
            .catch((playbackError) => {
              currentAudioRef.current = null;
              reject(playbackError);
            });
        });
      };

      if (sharedAudioCacheRef.current.has(cacheKey)) {
        sharedCacheHitsRef.current += 1;
        console.log("[SpeakSite Audio] Cache HIT:", cacheKey);
        try {
          await playAudio(sharedAudioCacheRef.current.get(cacheKey), "(CACHED)");
          return;
        } catch (cacheError) {
          sharedAudioCacheRef.current.delete(cacheKey);
          console.error("[SpeakSite Audio] Cached play failed:", cacheError);
          setError("Voice output fallback");
          fallbackSpeak(trimmedText, onComplete, overrideVoice);
          return;
        }
      }

      sharedCacheMissesRef.current += 1;
      console.log("[SpeakSite Audio] Cache MISS:", cacheKey);

      try {
        const url = await fetchAndCacheAudio(trimmedText, voiceId);
        await playAudio(url, "(API call)");
        return;
      } catch (speakError) {
        console.error("[SpeakSite] Murf failed:", speakError);
        setError("Voice output fallback");
        fallbackSpeak(trimmedText, onComplete, overrideVoice);
      }
    },
    [fallbackSpeak, selectedLanguage, setVoiceStatus],
  );

  return {
    speak,
    isSpeaking,
    error,
    cancelSpeech,
    pendingResponseText,
    prewarmCache,
    audioCacheRef: sharedAudioCacheRef,
  };
};

export default useVoiceOutput;
