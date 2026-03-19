export const COMMAND_CATEGORIES = [
  {
    id: "navigation",
    label: "Navigation",
    color: "purple",
    commands: [
      {
        syntax: "go to home",
        description: "Navigate to the home page",
        example: "go to home",
        aliases: ["open home", "show home"],
      },
      {
        syntax: "go to signup",
        description: "Navigate to the sign up page",
        example: "go to signup page",
        aliases: ["open signup", "show signup"],
      },
      {
        syntax: "go to contact",
        description: "Navigate to the contact page",
        example: "open contact page",
        aliases: ["show contact", "contact page"],
      },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    color: "cyan",
    commands: [
      {
        syntax: "fill [field] with [value]",
        description: "Fill the name, email, or message field by voice",
        example: "fill email with hello@gmail.com",
        aliases: ["set [field] to [value]", "enter [value] in [field]"],
      },
      {
        syntax: "submit form",
        description: "Submit the active form",
        example: "submit form",
        aliases: ["submit", "send form"],
      },
    ],
  },
  {
    id: "smartfill",
    label: "Smart Form Filler",
    color: "amber",
    commands: [
      {
        syntax: "skip",
        description: "Skip the current Smart Form Filler field",
        example: "skip",
        aliases: [],
      },
      {
        syntax: "confirm",
        description: "Confirm and finish the Smart Form Filler flow",
        example: "confirm",
        aliases: ["submit"],
      },
      {
        syntax: "edit [field name]",
        description: "Jump back to a specific Smart Form Filler field",
        example: "edit email",
        aliases: [],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    color: "green",
    commands: [
      {
        syntax: "repeat",
        description: "Repeat the last spoken response",
        example: "repeat",
        aliases: ["say again"],
      },
      {
        syntax: "help",
        description: "Open the voice commands help panel",
        example: "help",
        aliases: ["show commands", "what can you do"],
      },
      {
        syntax: "close help",
        description: "Close the voice commands help panel",
        example: "close help",
        aliases: ["hide help", "dismiss help"],
      },
      {
        syntax: "switch to [language]",
        description: "Change the recognition and voice language",
        example: "switch to Hindi",
        aliases: ["change language to [language]", "speak in [language]"],
      },
      {
        syntax: "start demo",
        description: "Start the guided demo",
        example: "start demo",
        aliases: ["run demo", "show demo"],
      },
      {
        syntax: "stop demo",
        description: "Stop the guided demo",
        example: "stop demo",
        aliases: ["cancel demo", "end demo"],
      },
      {
        syntax: "switch to light mode",
        description: "Switch the app theme to light mode",
        example: "switch to light mode",
        aliases: ["light mode"],
      },
      {
        syntax: "switch to dark mode",
        description: "Switch the app theme to dark mode",
        example: "switch to dark mode",
        aliases: ["dark mode"],
      },
    ],
  },
];

export const ALL_COMMANDS = COMMAND_CATEGORIES.flatMap((cat) =>
  cat.commands.map((cmd) => ({ ...cmd, category: cat.id })),
);
