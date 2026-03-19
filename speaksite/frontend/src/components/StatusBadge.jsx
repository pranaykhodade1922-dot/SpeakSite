const StatusBadge = ({ status }) => {
  const badgeConfig = {
    idle: {
      label: "Ready",
      dotClass: "bg-[var(--text-muted)]",
    },
    listening: {
      label: "Listening...",
      dotClass: "bg-[var(--success)] shadow-[0_0_18px_var(--success)]",
    },
    processing: {
      label: "Processing...",
      dotClass: "bg-[var(--warning)] shadow-[0_0_18px_var(--warning)]",
    },
    speaking: {
      label: "Speaking...",
      dotClass: "bg-[var(--brand-bright)] shadow-[0_0_18px_var(--brand-bright)]",
    },
  };

  const config = badgeConfig[status] ?? badgeConfig.idle;
  const isAnimated = status === "listening" || status === "speaking";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
      <span className={`h-[6px] w-[6px] rounded-full ${config.dotClass} ${isAnimated ? "status-dot-blink" : ""}`} />
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge;
