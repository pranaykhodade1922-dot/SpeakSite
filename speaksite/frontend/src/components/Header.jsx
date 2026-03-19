import { useVoiceContext } from "../context/VoiceContext";

const Header = () => {
  const { selectedLanguage, voiceStatus, isDemoRunning, theme, toggleTheme } = useVoiceContext();

  const statusConfig = {
    idle: {
      label: "Ready",
      dotClass: "bg-[var(--text-muted)]",
      animate: false,
    },
    listening: {
      label: "Listening...",
      dotClass: "bg-[var(--success)] shadow-[0_0_18px_var(--success)]",
      animate: true,
    },
    speaking: {
      label: "Speaking...",
      dotClass: "bg-[var(--brand-bright)] shadow-[0_0_18px_var(--brand-bright)]",
      animate: true,
    },
    processing: {
      label: "Ready",
      dotClass: "bg-[var(--warning)] shadow-[0_0_18px_var(--warning)]",
      animate: true,
    },
  };

  const activeStatus = statusConfig[voiceStatus] || statusConfig.idle;

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        <div className="mx-auto flex h-[58px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex items-center gap-1 text-[20px] font-bold tracking-[-0.5px]">
            <span className="text-[var(--text-primary)]">Speak</span>
            <span className="text-[var(--brand-bright)]">Site</span>
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--accent)] align-middle" />
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-[14px] py-[5px] text-[12px] font-medium text-[var(--text-secondary)]">
              <span
                className={`h-[6px] w-[6px] rounded-full ${activeStatus.dotClass} ${
                  activeStatus.animate ? "status-dot-blink" : ""
                }`}
              />
              <span>{activeStatus.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-[14px] py-[5px] text-[13px] text-[var(--text-primary)]">
              <span>{selectedLanguage.flag}</span>
              <span className="hidden sm:inline">{selectedLanguage.name}</span>
            </div>
          </div>
        </div>
      </header>

      {isDemoRunning ? (
        <div className="border-b border-[var(--border-default)] bg-[var(--brand-dim)] px-4 py-2 text-center text-[12px] font-medium text-[var(--brand-bright)]">
          Guided demo running
        </div>
      ) : null}
    </>
  );
};

export default Header;
