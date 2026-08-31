import type { ButtonHTMLAttributes } from "react";

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, string> = { overview: "▦", modules: "◫", statistics: "⌁", settings: "⚙", bell: "♧", search: "⌕", logout: "↪", sun: "☼", moon: "☾", menu: "☰", users: "♚", online: "●", message: "◌", voice: "◉", arrow: "↗" };
  return <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>{icons[name] ?? "•"}</span>;
}

export function Toggle({ checked, label, ...props }: { checked: boolean; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`toggle ${checked ? "is-on" : ""}`} aria-label={label} aria-pressed={checked}><span /></button>;
}

export function Stat({ icon, tone, title, value, detail }: { icon: string; tone: string; title: string; value: string; detail: string }) {
  const [increase, ...caption] = detail.split(" ");
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} size={21} /></div><div><span>{title}</span><strong>{value}</strong><small className="positive">↑ {increase} <em>{caption.join(" ")}</em></small></div></article>;
}
