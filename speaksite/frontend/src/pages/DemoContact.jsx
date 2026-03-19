import { useVoiceContext } from "../context/VoiceContext";

const fieldBaseClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] px-4 py-3 text-[14px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-dim)]";

const labelClass =
  "font-mono-ui flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]";

const DemoContact = () => {
  const { formData, updateField, submitForm, isSubmitted, lastUpdatedField, t } = useVoiceContext();

  const getFieldClass = (field) => `${fieldBaseClass} ${lastUpdatedField === field ? "voice-filled" : ""}`;

  return (
    <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-card)] p-6 md:p-8">
      <div className="mb-8">
        <span className="font-mono-ui inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
          {t.contactPage.tag}
        </span>
        <h2 className="mt-4 text-[24px] font-[800] tracking-[-0.05em] text-[var(--text-primary)]">{t.contactPage.title}</h2>
        <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">{t.contactPage.subtitle}</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>
              {t.contactPage.labelName}
              <span className="text-[var(--brand-bright)]">*</span>
            </span>
            <input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={getFieldClass("name")}
              placeholder={t.contactPage.placeholderName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelClass}>
              {t.contactPage.labelEmail}
              <span className="text-[var(--brand-bright)]">*</span>
            </span>
            <input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={getFieldClass("email")}
              placeholder={t.contactPage.placeholderEmail}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {t.contactPage.labelMessage}
            <span className="text-[var(--brand-bright)]">*</span>
          </span>
          <textarea
            id="contact-message"
            rows="5"
            value={formData.message}
            onChange={(event) => updateField("message", event.target.value)}
            className={`${getFieldClass("message")} min-h-[132px] resize-none`}
            placeholder={t.contactPage.placeholderMsg}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
          <p className="font-mono-ui text-[11px] text-[var(--text-muted)]">{t.contactPage.hint}</p>
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[var(--brand-bright)] hover:shadow-[var(--shadow-brand)]"
          >
            {t.contactPage.submitBtn}
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--success)] bg-[rgba(0,224,122,0.08)] px-4 py-3 text-[13px] font-medium text-[var(--success)]">
            <span>{t.contactPage.successIcon}</span>
            <span>{t.contactPage.successMsg}</span>
          </div>
        ) : null}
      </form>
    </section>
  );
};

export default DemoContact;
