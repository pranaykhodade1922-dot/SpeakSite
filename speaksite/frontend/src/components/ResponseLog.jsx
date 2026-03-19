import { useEffect, useMemo, useRef } from "react";
import { useVoiceContext } from "../context/VoiceContext";

const styles = {
  action: {
    border: "border-[var(--accent)]",
    icon: "\u2713",
  },
  success: {
    border: "border-[var(--success)]",
    icon: "+",
  },
  error: {
    border: "border-[var(--error)]",
    icon: "!",
  },
  system: {
    border: "border-[var(--brand-bright)]",
    icon: "*",
  },
};

const ResponseLog = ({ simulateCommand, chipsDisabled = false }) => {
  const { responseLog, t } = useVoiceContext();
  const containerRef = useRef(null);

  const commandChips = useMemo(
    () => [
      { label: t.voicePanel.chip1, text: "open signup page" },
      { label: t.voicePanel.chip2, text: "open contact page" },
      { label: t.voicePanel.chip3, text: "fill name with Rahul" },
      { label: t.voicePanel.chip4, text: "submit form" },
    ],
    [t],
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [responseLog]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="font-mono-ui mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {t.voicePanel.actionLog}
      </p>

      <div id="log-list" ref={containerRef} className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        {responseLog.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-center">
            <div className="font-mono-ui text-2xl text-[var(--text-muted)]">[]</div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t.voicePanel.noCommands}</p>
            <p className="text-xs text-[var(--text-secondary)]">{t.voicePanel.tryChips}</p>
          </div>
        ) : (
          responseLog.map((entry) => {
            const style = styles[entry.type] || styles.system;
            return (
              <article
                key={entry.id}
                className={`log-entry log-entry-slide rounded-[var(--radius-md)] border border-[var(--border-default)] border-l-2 ${style.border} bg-[var(--bg-card)] px-3 py-3`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-[1px] text-[13px] text-[var(--text-secondary)]">{style.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{entry.text}</p>
                    <p className="font-mono-ui mt-1 text-[10px] text-[var(--text-muted)]">{entry.timestamp}</p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {commandChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={chipsDisabled}
            onClick={() => simulateCommand(chip.text)}
            className="font-mono-ui rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[10px] text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-40"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default ResponseLog;
