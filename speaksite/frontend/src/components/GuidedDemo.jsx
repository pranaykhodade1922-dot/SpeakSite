import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVoiceContext } from "../context/VoiceContext";
import useVoiceOutput from "../hooks/useVoiceOutput";

const GuidedDemo = () => {
  const {
    setTranscript,
    navigateTo,
    updateField,
    submitForm,
    addToLog,
    isDemoRunning,
    setIsDemoRunning,
    demoStep,
    setDemoStep,
    setTriggerDemo,
    t,
  } = useVoiceContext();
  const { speak, cancelSpeech } = useVoiceOutput();
  const demoTimeoutRef = useRef(null);
  const isDemoRunningRef = useRef(false);
  const stepResolverRef = useRef(null);
  const runDemoRef = useRef(null);
  const stopDemoRef = useRef(null);

  useEffect(() => {
    isDemoRunningRef.current = isDemoRunning;
  }, [isDemoRunning]);

  const demoSteps = useMemo(
    () => [
      {
        id: 1,
        command: null,
        narration:
          "Welcome to the SpeakSite demo. Watch as I navigate this website entirely using voice commands.",
        action: null,
        delay: 4000,
        label: t.guidedDemo.label1,
      },
      {
        id: 2,
        command: "go to signup page",
        narration: "Opening the sign up page. Please fill in your name and email.",
        action: () => navigateTo("signup"),
        delay: 3500,
        label: t.guidedDemo.label2,
      },
      {
        id: 3,
        command: "fill name with Rahul Sharma",
        narration: "Got it. I've filled in the name field.",
        action: () => updateField("name", "Rahul Sharma"),
        delay: 3000,
        label: t.guidedDemo.label3,
      },
      {
        id: 4,
        command: "fill email with rahul@company.com",
        narration: "Got it. I've filled in the email field.",
        action: () => updateField("email", "rahul@company.com"),
        delay: 3000,
        label: t.guidedDemo.label4,
      },
      {
        id: 5,
        command: "submit form",
        narration: "Form submitted successfully. Thank you!",
        action: () => submitForm(),
        delay: 3000,
        label: t.guidedDemo.label5,
      },
      {
        id: 6,
        command: null,
        narration:
          "That's SpeakSite. Navigate, fill, and submit entirely by voice, powered by Murf Falcon AI.",
        action: null,
        delay: 4000,
        label: t.guidedDemo.label6,
      },
    ],
    [navigateTo, submitForm, t, updateField],
  );

  const clearPendingStep = useCallback(() => {
    if (demoTimeoutRef.current) {
      window.clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }

    if (stepResolverRef.current) {
      stepResolverRef.current();
      stepResolverRef.current = null;
    }
  }, []);

  const stopDemo = useCallback(() => {
    isDemoRunningRef.current = false;
    setIsDemoRunning(false);
    clearPendingStep();
    cancelSpeech();
    setDemoStep(-1);
    setTranscript("");
    addToLog(t.logs.demoStopped, "system");
  }, [addToLog, cancelSpeech, clearPendingStep, setDemoStep, setIsDemoRunning, setTranscript, t]);

  const skipStep = useCallback(() => {
    clearPendingStep();
  }, [clearPendingStep]);

  const runDemo = useCallback(async () => {
    if (isDemoRunningRef.current) {
      return;
    }

    setIsDemoRunning(true);
    isDemoRunningRef.current = true;
    setDemoStep(0);

    for (let index = 0; index < demoSteps.length; index += 1) {
      if (!isDemoRunningRef.current) {
        break;
      }

      const step = demoSteps[index];
      setDemoStep(index);

      if (step.command) {
        setTranscript(step.command);
        addToLog(`"${step.command}"`, "action");
      }

      if (step.action) {
        step.action();
      }

      await speak(step.narration);

      if (!isDemoRunningRef.current) {
        break;
      }

      await new Promise((resolve) => {
        stepResolverRef.current = resolve;
        demoTimeoutRef.current = window.setTimeout(() => {
          demoTimeoutRef.current = null;
          stepResolverRef.current = null;
          resolve();
        }, step.delay);
      });
    }

    isDemoRunningRef.current = false;
    setIsDemoRunning(false);
    setDemoStep(-1);
    setTranscript("");
  }, [addToLog, demoSteps, setDemoStep, setIsDemoRunning, setTranscript, speak]);

  useEffect(() => {
    runDemoRef.current = runDemo;
    stopDemoRef.current = stopDemo;
  }, [runDemo, stopDemo]);

  useEffect(() => {
    setTriggerDemo(() => () => runDemoRef.current?.());
    return () => {
      setTriggerDemo(null);
    };
  }, [setTriggerDemo]);

  useEffect(() => {
    const handleStart = () => {
      runDemoRef.current?.();
    };
    const handleStop = () => {
      stopDemoRef.current?.();
    };

    window.addEventListener("start-guided-demo", handleStart);
    window.addEventListener("stop-guided-demo", handleStop);

    return () => {
      window.removeEventListener("start-guided-demo", handleStart);
      window.removeEventListener("stop-guided-demo", handleStop);
      clearPendingStep();
      cancelSpeech();
    };
  }, [cancelSpeech, clearPendingStep]);

  const currentStep = demoStep >= 0 ? demoSteps[demoStep] : null;

  return (
    <>
      {isDemoRunning && currentStep ? (
        <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-[var(--border-default)] bg-[rgba(8,9,14,0.96)] px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono-ui rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--brand-bright)]">
                  Demo mode
                </span>
                <span className="text-[13px] text-[var(--text-primary)]">
                  {t.guidedDemo.step} {currentStep.id} {t.guidedDemo.stepOf} {demoSteps.length} - {currentStep.label}
                </span>
              </div>
              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--border-subtle)]">
                <div
                  key={`${currentStep.id}-${currentStep.delay}`}
                  className="h-full bg-[var(--brand)]"
                  style={{
                    width: "100%",
                    animation: `demo-progress ${currentStep.delay}ms linear forwards`,
                    transformOrigin: "left center",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={skipStep}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                {t.guidedDemo.skipStep}
              </button>
              <button
                type="button"
                onClick={stopDemo}
                className="rounded-[var(--radius-md)] border border-[var(--error)] bg-[rgba(255,77,106,0.08)] px-3 py-2 text-[12px] text-[var(--error)] transition hover:bg-[rgba(255,77,106,0.14)]"
              >
                {t.guidedDemo.stopDemo}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GuidedDemo;
