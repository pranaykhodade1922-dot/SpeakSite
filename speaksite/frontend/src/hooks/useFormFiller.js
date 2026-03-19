import { useCallback, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useFormFiller() {
  const [formData, setFormData] = useState(null);
  const [fields, setFields] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filledValues, setFilledValues] = useState({});
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("html");
  const [htmlInput, setHtmlInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const currentField = fields[currentIndex] || null;
  const totalFields = fields.length;
  const progress =
    totalFields > 0 ? Math.round((Object.keys(filledValues).length / totalFields) * 100) : 0;

  const loadFromHTML = useCallback(async (html) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/parse-form-html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (data.fields.length === 0) {
        throw new Error("No form fields found. Make sure the HTML contains a form.");
      }
      setFormData(data);
      setFields(data.fields);
      setFilledValues({});
      setCurrentIndex(0);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  }, []);

  const loadFromURL = useCallback(async (url) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/parse-form-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (data.fields.length === 0) {
        throw new Error("No form fields found at that URL.");
      }
      setFormData(data);
      setFields(data.fields);
      setFilledValues({});
      setCurrentIndex(0);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  }, []);

  const mapSpeechToField = useCallback(async (speech, field) => {
    const res = await fetch(`${API_BASE_URL}/map-fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speech, field }),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return await res.json();
  }, []);

  const fillCurrentField = useCallback(
    async (speech) => {
      if (!currentField) {
        return null;
      }
      const mapped = await mapSpeechToField(speech, currentField);
      if (mapped.needs_clarification) {
        return mapped;
      }
      setFilledValues((prev) => ({
        ...prev,
        [currentIndex]: {
          field: currentField,
          value: mapped.value,
          display: mapped.display,
        },
      }));
      return mapped;
    },
    [currentField, currentIndex, mapSpeechToField],
  );

  const goToNextField = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < totalFields - 1) {
        return prev + 1;
      }
      setStatus("confirming");
      return prev;
    });
  }, [totalFields]);

  const goToFieldByName = useCallback(
    (name) => {
      const idx = fields.findIndex((field) =>
        (field.label || field.name || "").toLowerCase().includes(name.toLowerCase()),
      );
      if (idx !== -1) {
        setCurrentIndex(idx);
        setStatus("filling");
      }
    },
    [fields],
  );

  const editField = useCallback((index) => {
    setCurrentIndex(index);
    setStatus("filling");
  }, []);

  const reset = useCallback(() => {
    setFormData(null);
    setFields([]);
    setCurrentIndex(0);
    setFilledValues({});
    setStatus("idle");
    setErrorMsg("");
    setHtmlInput("");
    setUrlInput("");
    setDragOver(false);
  }, []);

  return {
    formData,
    fields,
    currentIndex,
    currentField,
    filledValues,
    status,
    errorMsg,
    isOpen,
    activeTab,
    htmlInput,
    urlInput,
    dragOver,
    progress,
    totalFields,
    setIsOpen,
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
  };
}
