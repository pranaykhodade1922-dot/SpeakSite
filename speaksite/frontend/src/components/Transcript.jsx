import { useVoiceContext } from "../context/VoiceContext";

const Transcript = ({ transcript, isInterim = false, status = "idle", pendingResponseText = "" }) => {
  const { t } = useVoiceContext();
  const hasTranscript = Boolean(transcript?.trim());
  const isListening = status === "listening";
  const isSpeaking = status === "speaking";

  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {t.voicePanel.transcript}
      </p>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3">
        <p
          className={`font-mono-ui text-[14px] ${
            hasTranscript || isSpeaking
              ? isInterim
                ? "italic text-[var(--text-secondary)]"
                : "text-[var(--text-primary)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          {isSpeaking ? pendingResponseText || t.voicePanel.waiting : transcript || t.voicePanel.waiting}
          {isListening ? <span className="ml-1 pulse-dot text-[var(--accent)]">▊</span> : null}
        </p>
      </div>
    </div>
  );
};

export default Transcript;
