import { getLanguageByName } from "./languages";

const INTENTS = {
  NAVIGATE_HOME: [
    /^(?:go\s+to|open|show|take\s+me\s+to)\s+(?:the\s+)?home(?:\s+page)?$/i,
    /^(?:back\s+to|return\s+to)\s+(?:the\s+)?home(?:\s+page)?$/i,
    /^(?:home\s+page|home)$/i,
  ],
  NAVIGATE_SIGNUP: [
    /^(?:go\s+to|open|show)\s+(?:the\s+)?(?:sign\s*up|signup)(?:\s+page)?$/i,
    /^(?:go\s+to|open|show)\s+(?:the\s+)?registration\s+page$/i,
    /^(?:create\s+account|i\s+want\s+to\s+create\s+an?\s+account)$/i,
  ],
  NAVIGATE_CONTACT: [
    /^(?:go\s+to|open|show)\s+(?:the\s+)?contact(?:\s+page)?$/i,
    /^(?:go\s+to|open|show)\s+contact\s+us$/i,
    /^(?:contact\s+page|contact\s+us)$/i,
  ],
  SUBMIT_FORM: [
    /^submit$/i,
    /^submit(?:\s+the)?\s+form$/i,
    /^send(?:\s+the)?(?:\s+form|\s+it)?$/i,
  ],
  REPEAT: [/^repeat$/i, /^say\s+again$/i, /^what\s+did\s+you\s+say$/i],
  START_DEMO: [/^start\s+demo$/i, /^run\s+demo$/i, /^show\s+demo$/i, /^demo\s+mode$/i],
  STOP_DEMO: [/^stop\s+demo$/i, /^cancel\s+demo$/i, /^end\s+demo$/i],
  HELP: [/^help$/i, /^what\s+can\s+you\s+do$/i, /^show\s+commands$/i],
  CLOSE_HELP: [/^close\s+help$/i, /^hide\s+help$/i, /^dismiss\s+help$/i],
  SET_THEME_LIGHT: [/^switch\s+to\s+light\s+mode$/i, /^light\s+mode$/i, /^turn\s+on\s+light\s+mode$/i],
  SET_THEME_DARK: [/^switch\s+to\s+dark\s+mode$/i, /^dark\s+mode$/i, /^turn\s+on\s+dark\s+mode$/i],
};

const FIELD_ALIASES = {
  name: "name",
  "full name": "name",
  email: "email",
  "email address": "email",
  message: "message",
};

const FILL_PATTERNS = [
  /^fill\s+(?<field>name|full\s+name|email|email\s+address|message)\s+with\s+(?<value>.+)$/i,
  /^set\s+(?<field>name|full\s+name|email|email\s+address|message)\s+to\s+(?<value>.+)$/i,
  /^my\s+(?<field>name|full\s+name|email|email\s+address|message)\s+is\s+(?<value>.+)$/i,
  /^enter\s+(?<value>.+)\s+in\s+(?<field>name|full\s+name|email|email\s+address|message)$/i,
];

const responses = {
  NAVIGATE_HOME: "Opening the home page.",
  NAVIGATE_SIGNUP: "Opening the sign up page. Please fill in your name and email.",
  NAVIGATE_CONTACT: "Opening the contact page.",
  SUBMIT_FORM: "Form submitted successfully. Thank you!",
  REPEAT: "",
  START_DEMO: "Starting the guided demo. Watch and enjoy.",
  STOP_DEMO: "Demo stopped.",
  HELP: "Here are the things I can do.",
  CLOSE_HELP: "Closing help.",
  SET_THEME_LIGHT: "Switching to light mode.",
  SET_THEME_DARK: "Switching to dark mode.",
};

const normalizeField = (rawField) => FIELD_ALIASES[rawField.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;

export const parseCommand = (text) => {
  const normalizedText = text.toLowerCase().trim().replace(/\s+/g, " ");

  if (!normalizedText) {
    return {
      intent: "UNKNOWN",
      entity: null,
      field: null,
      response_text:
        "I didn't catch that. Try saying 'go to signup page' or 'fill email with your email'.",
    };
  }

  for (const pattern of FILL_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match?.groups) {
      const field = normalizeField(match.groups.field);
      const entity = match.groups.value.trim();

      if (field && entity) {
        return {
          intent: "FILL_FIELD",
          entity,
          field,
          response_text: `Got it. I've filled in the ${field} field.`,
        };
      }
    }
  }

  const languageMatchers = [
    /^(?:switch\s+to|change\s+language\s+to|speak\s+in|use)\s+(?<language>english|hindi|spanish|french)$/i,
    /^(?:habla|speak)\s+(?<language>spanish|espanol|english|hindi|french)$/i,
  ];

  for (const pattern of languageMatchers) {
    const match = normalizedText.match(pattern);
    if (match?.groups?.language) {
      const rawLanguage = match.groups.language === "espanol" ? "spanish" : match.groups.language;
      const language = getLanguageByName(rawLanguage);
      if (language) {
        return {
          intent: "CHANGE_LANGUAGE",
          entity: null,
          field: null,
          language,
          response_text: `Switching to ${language.name}.`,
        };
      }
    }
  }

  for (const [intent, patterns] of Object.entries(INTENTS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent,
          entity: null,
          field: null,
          language: null,
          response_text: responses[intent],
        };
      }
    }
  }

  return {
    intent: "UNKNOWN",
    entity: null,
    field: null,
    language: null,
    response_text:
      "I didn't catch that. Try saying 'go to signup page' or 'fill email with your email'.",
  };
};
