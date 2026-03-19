import { useEffect, useRef, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import { parseCommand } from "../utils/commandParser";

const EARLY_INTENTS = new Set([
  "NAVIGATE_HOME",
  "NAVIGATE_SIGNUP",
  "NAVIGATE_CONTACT",
  "HELP",
  "CLOSE_HELP",
  "SET_THEME_LIGHT",
  "SET_THEME_DARK",
  "START_DEMO",
  "STOP_DEMO",
]);

const useSpeechInput = (onResult, onError, onInterim) => {
  const { selectedLanguage } = useVoiceContext();
  const recognitionRef = useRef(null);
  const dispatchedTextRef = useRef("");
  const [isListening, setIsListening] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      onError("Your browser doesn't support voice input. Try Chrome or Edge.");
      return undefined;
    }

    return undefined;
  }, [isSupported, onError]);

  useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage.lang;

    recognition.onstart = () => {
      dispatchedTextRef.current = "";
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const displayText = (interimTranscript || finalTranscript).trim();
      if (displayText && onInterim) {
        onInterim(displayText, Boolean(finalTranscript.trim()));
      }

      const normalizedInterim = interimTranscript.trim().toLowerCase();
      if (normalizedInterim) {
        const parsedInterim = parseCommand(normalizedInterim);
        if (
          EARLY_INTENTS.has(parsedInterim.intent) &&
          dispatchedTextRef.current !== normalizedInterim
        ) {
          dispatchedTextRef.current = normalizedInterim;
          setIsListening(false);
          onResult(normalizedInterim);
          recognition.stop();
          return;
        }
      }

      const normalizedFinal = finalTranscript.trim().toLowerCase();
      if (normalizedFinal && dispatchedTextRef.current !== normalizedFinal) {
        dispatchedTextRef.current = normalizedFinal;
        setIsListening(false);
        onResult(normalizedFinal);
        recognition.stop();
      }
    };

    recognition.onnomatch = () => {
      setIsListening(false);
      onError("I couldn't match that to a command.");
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        onError("Microphone access was denied.");
        return;
      }

      if (event.error === "no-speech") {
        onError("No speech detected.");
        return;
      }

      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [SpeechRecognition, isSupported, onError, onInterim, onResult, selectedLanguage.lang]);

  const startListening = () => {
    if (!isSupported) {
      onError("Your browser doesn't support voice input. Try Chrome or Edge.");
      return;
    }

    dispatchedTextRef.current = "";

    try {
      recognitionRef.current?.start();
    } catch (error) {
      onError("Voice recognition is already active.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { startListening, stopListening, isListening, isSupported };
};

export default useSpeechInput;
