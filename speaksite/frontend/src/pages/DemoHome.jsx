import { useEffect, useMemo, useState } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import useVoiceOutput from "../hooks/useVoiceOutput";

const DemoHome = () => {
  const { navigateTo, addToLog, triggerDemo, isDemoRunning, t } = useVoiceContext();
  const { speak } = useVoiceOutput();
  const [isOpeningSignup, setIsOpeningSignup] = useState(false);
  const [showDemoToast, setShowDemoToast] = useState(false);

  const stats = useMemo(
    () => [
      { value: t.homePage.stat1Value, label: t.homePage.stat1Label, tone: "text-[var(--brand-bright)]" },
      { value: t.homePage.stat2Value, label: t.homePage.stat2Label, tone: "text-[var(--accent)]" },
      { value: t.homePage.stat3Value, label: t.homePage.stat3Label, tone: "text-[var(--success)]" },
    ],
    [t],
  );

  const features = useMemo(
    () => [
      { icon: "VOICE", title: t.homePage.feature1Title, description: t.homePage.feature1Desc },
      { icon: "FORM", title: t.homePage.feature2Title, description: t.homePage.feature2Desc },
      { icon: "FLOW", title: t.homePage.feature3Title, description: t.homePage.feature3Desc },
      { icon: "FAST", title: t.homePage.feature4Title, description: t.homePage.feature4Desc },
    ],
    [t],
  );

  useEffect(() => {
    if (!showDemoToast) {
      return undefined;
    }

    const toastTimeout = window.setTimeout(() => {
      setShowDemoToast(false);
    }, 2400);

    return () => {
      window.clearTimeout(toastTimeout);
    };
  }, [showDemoToast]);

  const handleGetStarted = async () => {
    setIsOpeningSignup(true);
    navigateTo("signup");
    addToLog(t.logs.getStartedNav, "action");
    window.setTimeout(() => {
      setIsOpeningSignup(false);
    }, 700);
    await speak("Let's get you signed up. Please fill in your name and email address.");
  };

  const handleWatchDemo = () => {
    if (triggerDemo) {
      triggerDemo();
      addToLog(t.logs.demoStartedButton, "system");
      return;
    }

    setShowDemoToast(true);
  };

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-card)] p-6 md:p-8">
        <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-[260px] w-[260px] rounded-full bg-[var(--brand-dim)]" />
        <div className="pointer-events-none absolute bottom-[-110px] left-[-90px] h-[240px] w-[240px] rounded-full bg-[var(--accent-dim)]" />

        <div className="relative max-w-[620px]">
          <span className="font-mono-ui inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-bright)]">
            {t.homePage.tag}
          </span>
          <h2 className="mt-4 text-[30px] font-[800] tracking-[-0.06em] text-[var(--text-primary)] md:text-[42px]">
            {t.homePage.title}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{t.homePage.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              disabled={isOpeningSignup}
              className="rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[var(--brand-bright)] hover:shadow-[var(--shadow-brand)] disabled:cursor-wait disabled:opacity-80"
            >
              {isOpeningSignup ? t.homePage.ctaPrimaryLoading : t.homePage.ctaPrimary}
            </button>
            <button
              type="button"
              onClick={handleWatchDemo}
              disabled={isDemoRunning}
              className={`rounded-[var(--radius-md)] border px-5 py-3 text-[14px] font-semibold transition ${
                isDemoRunning
                  ? "cursor-not-allowed border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand-bright)]"
                  : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {isDemoRunning ? t.homePage.ctaSecondaryRunning : `${"\u25B6"} ${t.homePage.ctaSecondary}`}
            </button>
          </div>
        </div>
      </div>

      {showDemoToast ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[12px] text-[var(--text-secondary)]">
          {t.homePage.demoWarmup}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <div className={`font-mono-ui text-[28px] font-bold tracking-[-0.06em] ${stat.tone}`}>{stat.value}</div>
            <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
          >
            <div className="mb-4 inline-flex rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono-ui text-[11px] text-[var(--accent)]">
              {feature.icon}
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{feature.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DemoHome;
