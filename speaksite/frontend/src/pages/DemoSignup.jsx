import { useVoiceContext } from "../context/VoiceContext";

const fieldBaseClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)] px-4 py-3 text-[14px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-dim)]";

const labelClass =
  "font-mono-ui flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]";

const DemoSignup = () => {
  const { formData, updateField, submitForm, isSubmitted, lastUpdatedField, t } = useVoiceContext();

  const getFieldClass = (field) => `${fieldBaseClass} ${lastUpdatedField === field ? "voice-filled" : ""}`;

  return (
    <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-card)] p-6 md:p-8">
      <div className="mb-8">
        <span className="font-mono-ui inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-bright)]">
          {t.signupPage.tag}
        </span>
        <h2 className="mt-4 text-[24px] font-[800] tracking-[-0.05em] text-[var(--text-primary)]">{t.signupPage.title}</h2>
        <p className="mt-2 text-[14px] leading-7 text-[var(--text-secondary)]">
          {t.signupPage.subtitleAlt || t.signupPage.subtitle}
        </p>
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
              {t.signupPage.labelFirstName}
              <span className="text-[var(--brand-bright)]">*</span>
            </span>
            <input
              id="signup-name"
              type="text"
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={getFieldClass("name")}
              placeholder={t.signupPage.placeholderFirstName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelClass}>
              {t.signupPage.labelLastName}
              <span className="text-[var(--brand-bright)]">*</span>
            </span>
            <input type="text" className={fieldBaseClass} placeholder={t.signupPage.placeholderLastName} />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {t.signupPage.labelEmail}
            <span className="text-[var(--brand-bright)]">*</span>
          </span>
          <input
            id="signup-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={getFieldClass("email")}
            placeholder={t.signupPage.placeholderEmail}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {t.signupPage.labelPassword}
            <span className="text-[var(--brand-bright)]">*</span>
          </span>
          <input id="signup-password" type="password" className={fieldBaseClass} placeholder={t.signupPage.placeholderPassword} />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
          <p className="font-mono-ui text-[11px] text-[var(--text-muted)]">{t.signupPage.hint}</p>
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[var(--brand-bright)] hover:shadow-[var(--shadow-brand)]"
          >
            {t.signupPage.submitBtn}
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--success)] bg-[rgba(0,224,122,0.08)] px-4 py-3 text-[13px] font-medium text-[var(--success)]">
            <span>{t.signupPage.successIcon}</span>
            <span>{t.signupPage.successMsg}</span>
          </div>
        ) : null}
      </form>
    </section>
  );
};

export default DemoSignup;
