import { useEffect } from "react";

const UniversalVoiceLayer = () => {
  useEffect(() => {
    window.__speaksiteUniversalVoiceMounted = true;

    return () => {
      delete window.__speaksiteUniversalVoiceMounted;
    };
  }, []);

  return null;
};

export default UniversalVoiceLayer;
