export const LANGUAGES = [
  {
    code: "en-US",
    lang: "en-US",
    name: "English",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    voices: {
      female: {
        voiceId: "en-US-natalie",
        label: "Natalie",
        gender: "female",
      },
      male: {
        voiceId: "en-US-ken",
        label: "Ken",
        gender: "male",
      },
    },
    defaultGender: "female",
  },
  {
    code: "hi-IN",
    lang: "hi-IN",
    name: "Hindi",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
    voices: {
      female: {
        voiceId: "hi-IN-shweta",
        label: "Shweta",
        gender: "female",
      },
      male: {
        voiceId: "hi-IN-aarav",
        label: "Aarav",
        gender: "male",
      },
    },
    defaultGender: "female",
  },
  {
    code: "es-ES",
    lang: "es-ES",
    name: "Spanish",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    voices: {
      female: {
        voiceId: "es-ES-lucia",
        label: "Lucia",
        gender: "female",
      },
      male: {
        voiceId: "es-ES-sergio",
        label: "Sergio",
        gender: "male",
      },
    },
    defaultGender: "female",
  },
  {
    code: "fr-FR",
    lang: "fr-FR",
    name: "French",
    flag: "\uD83C\uDDEB\uD83C\uDDF7",
    voices: {
      female: {
        voiceId: "fr-FR-juliette",
        label: "Juliette",
        gender: "female",
      },
      male: {
        voiceId: "fr-FR-maxime",
        label: "Maxime",
        gender: "male",
      },
    },
    defaultGender: "female",
  },
];

export const getVoiceId = (language, gender) => language.voices[gender]?.voiceId || language.voices.female.voiceId;

export const getActiveVoice = (language, gender) => language.voices[gender] || language.voices.female;

export const DEFAULT_LANGUAGE = {
  ...LANGUAGES[0],
  lang: LANGUAGES[0].code,
  selectedGender: "female",
  voiceId: LANGUAGES[0].voices.female.voiceId,
  label: "Natalie (US)",
};

export const getLanguageByCode = (code) => LANGUAGES.find((language) => language.code === code);

export const getLanguageByName = (name) =>
  LANGUAGES.find((language) => language.name.toLowerCase() === name.trim().toLowerCase());

export const LANGUAGE_CONFIRMATIONS = {
  "en-US": "Language set to English.",
  "hi-IN": "\u092D\u093E\u0937\u093E \u0939\u093F\u0902\u0926\u0940 \u092E\u0947\u0902 \u0938\u0947\u091F \u0915\u0940 \u0917\u0908\u0964",
  "es-ES": "Idioma configurado en espa\u00F1ol.",
  "fr-FR": "Langue d\u00E9finie en fran\u00E7ais.",
};

export const VOICE_PREVIEWS = {
  "en-US": {
    female: "Hi, I'm Natalie. I'll be your voice assistant.",
    male: "Hi, I'm Ken. I'll be your voice assistant.",
  },
  "hi-IN": {
    female:
      "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 \u0936\u094D\u0935\u0947\u0924\u093E \u0939\u0942\u0901\u0964 \u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0938\u0939\u093E\u092F\u0915 \u0939\u0942\u0901\u0964",
    male:
      "\u0928\u092E\u0938\u094D\u0924\u0947, \u092E\u0948\u0902 \u0906\u0930\u0935 \u0939\u0942\u0901\u0964 \u092E\u0948\u0902 \u0906\u092A\u0915\u093E \u0938\u0939\u093E\u092F\u0915 \u0939\u0942\u0901\u0964",
  },
  "es-ES": {
    female: "Hola, soy Lucia. Ser\u00E9 tu asistente de voz.",
    male: "Hola, soy Sergio. Ser\u00E9 tu asistente de voz.",
  },
  "fr-FR": {
    female: "Bonjour, je suis Juliette. Je serai votre assistante.",
    male: "Bonjour, je suis Maxime. Je serai votre assistant.",
  },
};
