import { useEffect, useMemo } from "react";
import { useVoiceContext } from "../context/VoiceContext";

const HelpModal = ({ open, onClose }) => {
  const { t } = useVoiceContext();

  const commandGroups = useMemo(
    () => [
      {
        title: t.helpModal.navSection,
        rows: [
          [t.helpModal.cmd_home, t.helpModal.desc_home],
          [t.helpModal.cmd_signup, t.helpModal.desc_signup],
          [t.helpModal.cmd_contact, t.helpModal.desc_contact],
        ],
      },
      {
        title: t.helpModal.formSection,
        rows: [
          [t.helpModal.cmd_fillName, t.helpModal.desc_fillName],
          [t.helpModal.cmd_fillEmail, t.helpModal.desc_fillEmail],
          [t.helpModal.cmd_fillMsg, t.helpModal.desc_fillMsg],
          [t.helpModal.cmd_submit, t.helpModal.desc_submit],
        ],
      },
      {
        title: t.helpModal.langSection,
        rows: [
          [t.helpModal.cmd_hindi, t.helpModal.desc_hindi],
          [t.helpModal.cmd_english, t.helpModal.desc_english],
        ],
      },
      {
        title: t.helpModal.demoSection,
        rows: [
          [t.helpModal.cmd_demo, t.helpModal.desc_demo],
          [t.helpModal.cmd_stopDemo, t.helpModal.desc_stopDemo],
          [t.helpModal.cmd_help, t.helpModal.desc_help],
        ],
      },
      {
        title: t.helpModal.themeSection,
        rows: [
          [t.helpModal.cmd_light, t.helpModal.desc_light],
          [t.helpModal.cmd_dark, t.helpModal.desc_dark],
        ],
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleCloseEvent = () => onClose();
    window.addEventListener("close-help", handleCloseEvent);

    return () => {
      window.removeEventListener("close-help", handleCloseEvent);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[300] bg-[rgba(8,9,14,0.9)]" onClick={onClose} role="presentation">
      <div
        className="absolute left-1/2 top-1/2 w-[560px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-lg)] scale-in md:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[12px] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          {t.helpModal.closeBtn}
        </button>

        <h2 className="text-[22px] font-[800] tracking-[-0.04em] text-[var(--text-primary)]">{t.helpModal.title}</h2>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{t.helpModal.subtitle}</p>

        <div className="mt-6 space-y-5">
          {commandGroups.map((group) => (
            <section key={group.title}>
              <h3 className="font-mono-ui mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-brand)]">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.rows.map(([command, description]) => (
                  <div
                    key={command}
                    className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <span className="font-mono-ui rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px] text-[var(--accent)]">
                      {command}
                    </span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{description}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
