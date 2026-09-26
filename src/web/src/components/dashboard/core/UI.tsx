import type { ButtonHTMLAttributes } from "react";

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, string> = {
    overview: "▦",
    modules: "◫",
    statistics: "⌁",
    settings: "⚙",
    "audit-log": "⌘",
    audit: "✎",
    bell: "♧",
    search: "⌕",
    logout: "↪",
    sun: "☼",
    moon: "☾",
    menu: "☰",
    users: "♚",
    online: "●",
    message: "◌",
    voice: "◉",
    arrow: "↗",
  };
  return (
    <span aria-hidden="true" className="inline-block leading-none" style={{ fontSize: size }}>
      {icons[name] ?? "•"}
    </span>
  );
}

export function Toggle({
  checked,
  label,
  className = "",
  ...props
}: { checked: boolean; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative h-6 w-11 rounded-full border-0 p-0 transition-colors ${checked ? "bg-[#35c879]" : "bg-(--surface-3)"} ${props.disabled ? "cursor-wait opacity-60" : "cursor-pointer"} ${className}`}
      aria-label={label}
      aria-pressed={checked}
      disabled={props.disabled}
    >
      <span
        className={`absolute left-1 top-1 block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export function Stat({
  icon,
  tone,
  title,
  value,
  detail,
}: {
  icon: string;
  tone: string;
  title: string;
  value: string;
  detail: string;
}) {
  const [increase, ...caption] = detail.split(" ");
  const toneClass =
    {
      purple: "bg-[#735de0]/20 text-[#a894ff]",
      green: "bg-[#65e0a1]/15 text-[#65e0a1]",
      blue: "bg-[#5b9cf6]/15 text-[#78b1ff]",
      orange: "bg-[#f1a45b]/15 text-[#f1a45b]",
      pink: "bg-[#e985b4]/15 text-[#e985b4]",
    }[tone] ?? "bg-[var(--surface-3)] text-[var(--text-main)]";

  return (
    <article className="flex items-center gap-3 rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_10px_26px_var(--shadow-soft)]">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${toneClass}`}>
        <Icon name={icon} size={21} />
      </div>
      <div>
        <span className="block text-[10px] text-[var(--muted)]">{title}</span>
        <strong className="mt-0.5 block text-[23px] leading-tight text-[var(--text-main)]">
          {value}
        </strong>
        <small className="text-[10px] font-bold text-[#65e0a1]">
          ↑ {increase}{" "}
          <em className="font-normal not-italic text-[var(--muted)]">{caption.join(" ")}</em>
        </small>
      </div>
    </article>
  );
}
