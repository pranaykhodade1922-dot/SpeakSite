import { useEffect, useMemo, useState } from "react";
import GuidedDemo from "./components/GuidedDemo";
import Header from "./components/Header";
import HelpButton from "./components/HelpButton";
import HelpPanel from "./components/HelpPanel";
import UniversalVoiceLayer from "./components/UniversalVoiceLayer";
import VoiceOnboarding from "./components/VoiceOnboarding";
import VoicePanel from "./components/VoicePanel";
import { useVoiceContext } from "./context/VoiceContext";
import { preloadAudioPhrase } from "./hooks/useVoiceOutput";
import DemoContact from "./pages/DemoContact";
import DemoHome from "./pages/DemoHome";
import DemoSignup from "./pages/DemoSignup";

const pageComponents = {
  home: DemoHome,
  signup: DemoSignup,
  contact: DemoContact,
};

const PRELOAD_PHRASES = [
  "Opening the home page.",
  "Opening the sign up page. Please fill in your name and email.",
  "Opening the contact page.",
  "Got it. I've filled in the name field.",
  "Got it. I've filled in the email field.",
  "Got it. I've filled in the message field.",
  "Form submitted successfully. Thank you!",
  "Welcome to SpeakSite. This app lets you navigate a website entirely using your voice.",
  "You are all set. Click the microphone and start talking.",
  "I didn't catch that. Try saying go to signup page or fill email with your email.",
  "Starting the guided demo. Watch and enjoy.",
  "Demo stopped.",
  "Switching to light mode.",
  "Switching to dark mode.",
  "Language set to English.",
  "Here are the things I can do.",
];

const App = () => {
  const { activePage, navigateTo, addToLog, t, selectedLanguage, audioCacheRef } = useVoiceContext();
  const ActivePage = pageComponents[activePage] || DemoHome;
  const [showHelp, setShowHelp] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const tabs = useMemo(
    () => [
      { id: "home", label: t.nav.home, log: t.logs.navigatedHome },
      { id: "signup", label: t.nav.signup, log: t.logs.navigatedSignup },
      { id: "contact", label: t.nav.contact, log: t.logs.navigatedContact },
    ],
    [t],
  );

  const promptPills = useMemo(() => [t.hero.cmd1, t.hero.cmd2, t.hero.cmd3], [t]);

  const handleNavigate = (page, logText) => {
    navigateTo(page);
    addToLog(logText, "action");
  };

  const loadUrl = () => {
    let url = inputUrl.trim();
    if (!url) {
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    setIframeUrl(url);
    setUrlError("");
    setInputUrl(url);
  };

  const handleUrlKeyDown = (event) => {
    if (event.key === "Enter") {
      loadUrl();
    }
  };

  useEffect(() => {
    const handleOpenHelp = () => setShowHelp(true);
    const handleCloseHelp = () => setShowHelp(false);
    const handleLoadExternalUrl = (event) => {
      const requestedUrl = event.detail?.url?.trim();
      if (!requestedUrl) {
        return;
      }

      const normalizedUrl =
        requestedUrl.startsWith("http://") || requestedUrl.startsWith("https://")
          ? requestedUrl
          : `https://${requestedUrl}`;

      setIframeUrl(normalizedUrl);
      setInputUrl(normalizedUrl);
      setUrlError("");
    };
    const handleKeyDown = (event) => {
      if (event.key === "h" || event.key === "H") {
        setShowHelp(true);
      }

      if (event.key === "Escape") {
        setShowHelp(false);
      }

      if (
        event.key === " " &&
        event.target?.tagName !== "INPUT" &&
        event.target?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        window.dispatchEvent(new Event("toggle-mic"));
      }
    };

    window.addEventListener("open-help", handleOpenHelp);
    window.addEventListener("close-help", handleCloseHelp);
    window.addEventListener("load-voice-url", handleLoadExternalUrl);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-help", handleOpenHelp);
      window.removeEventListener("close-help", handleCloseHelp);
      window.removeEventListener("load-voice-url", handleLoadExternalUrl);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const selectedVoiceId = selectedLanguage?.voiceId || "en-US-natalie";

    const preloadAudio = async () => {
      console.log(
        "[SpeakSite Preload] Starting background preload of",
        PRELOAD_PHRASES.length,
        "phrases...",
      );

      let loaded = 0;

      for (const phrase of PRELOAD_PHRASES) {
        const cacheKey = `${selectedVoiceId}::${phrase.trim()}`;

        if (audioCacheRef.current.has(cacheKey)) {
          loaded += 1;
          continue;
        }

        const wasCached = await preloadAudioPhrase(phrase, selectedVoiceId);
        if (wasCached) {
          loaded += 1;
          console.log("[SpeakSite Preload]", `${loaded}/${PRELOAD_PHRASES.length}`, "ready");
        }

        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }

      console.log("[SpeakSite Preload] Complete.", loaded, "phrases cached and ready.");
    };

    const timer = window.setTimeout(() => {
      void preloadAudio();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [audioCacheRef, selectedLanguage]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <UniversalVoiceLayer />
      <VoiceOnboarding />
      <HelpButton onClick={() => setShowHelp((prev) => !prev)} isOpen={showHelp} />
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <Header />

      <main className="app-main mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 overflow-hidden px-4 py-6 md:px-6">
        <section className="app-shell flex min-h-0 w-full flex-1 gap-6 overflow-hidden">
          <div className="left-content-panel custom-scrollbar flex-1 overflow-y-scroll overflow-x-hidden rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border-subtle)",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              <input
                type="text"
                value={inputUrl}
                onChange={(event) => setInputUrl(event.target.value)}
                onKeyDown={handleUrlKeyDown}
                placeholder="Enter any URL to control by voice..."
                style={{
                  flex: 1,
                  height: "32px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  padding: "0 10px",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                }}
              />

              <button
                onClick={loadUrl}
                style={{
                  padding: "6px 14px",
                  background: "var(--brand)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
                type="button"
              >
                Load →
              </button>

              {iframeUrl ? (
                <button
                  onClick={() => {
                    setIframeUrl("");
                    setInputUrl("");
                    setUrlError("");
                  }}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                  type="button"
                >
                  ✕ Demo
                </button>
              ) : null}
            </div>

            <div
              id="speaksite-demo-content"
              className="left-panel-content flex min-h-full flex-col"
              style={{
                flex: 1,
                height: "100%",
                overflow: iframeUrl ? "hidden" : "auto",
                position: "relative",
              }}
            >
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                  title="Voice controlled page"
                  onError={() => setUrlError("Could not load this URL. Try another.")}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
                />
              ) : (
                <>
                  <div className="border-b border-[var(--border-subtle)] px-6 py-8 md:px-8">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-[640px]">
                        <p className="font-mono-ui mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-brand)]">
                          {t.hero.eyebrow}
                        </p>
                        <h1 className="text-[36px] font-[800] leading-[1.04] tracking-[-0.06em] text-[var(--text-primary)] md:text-[52px]">
                          {t.hero.title1} <span className="text-[var(--brand-bright)]">{t.hero.titleAccent}</span>
                        </h1>
                        <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[var(--text-secondary)]">
                          {t.hero.subtitle}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:max-w-[320px] lg:justify-end">
                        {promptPills.map((pill) => (
                          <span
                            key={pill}
                            className="font-mono-ui rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)]"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-[var(--border-subtle)] px-4 py-4 md:px-6">
                    <div className="grid gap-2 md:grid-cols-3">
                      {tabs.map((tab) => {
                        const isActive = activePage === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleNavigate(tab.id, tab.log)}
                            className={`rounded-[var(--radius-md)] border px-4 py-3 text-[13px] font-semibold transition-all ${
                              isActive
                                ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--text-primary)] shadow-[var(--shadow-brand)]"
                                : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="demo-area overflow-visible px-4 py-4 md:px-6 md:py-6">
                    <div className="page-fade">
                      <ActivePage />
                    </div>
                  </div>
                </>
              )}

              {urlError ? (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#ff4d6a",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {urlError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="right-voice-panel flex h-full w-[420px] min-w-[420px] flex-shrink-0 overflow-hidden">
            <VoicePanel />
          </div>
        </section>
      </main>

      <GuidedDemo />
    </div>
  );
};

export default App;
