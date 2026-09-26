import { Icon } from "./core/UI";

type TopbarProps = {
  pageTitle: string;
  mode: string;
  onMenu: () => void;
  onThemeToggle: () => void;
};

export default function Topbar({ pageTitle, mode, onMenu, onThemeToggle }: TopbarProps) {
  return (
    <header className="flex h-15 items-center justify-between border-b border-(--sidebar-border) bg-(--topbar-bg) px-5 backdrop-blur-md sm:px-10">
      <button
        className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-(--text-soft) hover:bg-(--surface-2) lg:hidden"
        onClick={onMenu}
        aria-label="Mở menu"
      >
        <Icon name="menu" size={22} />
      </button>
      <div className="flex items-center gap-2.5 text-xs text-(--muted)">
        <span>Dashboard</span>
        <i className="not-italic text-(--button-hover)">/</i>
        <strong className="text-(--text-main)">{pageTitle}</strong>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-8.5 w-48.5 items-center gap-1.5 rounded-lg border border-(--panel-border) bg-(--surface-2) px-2.5 text-[11px] text-(--muted) max-md:hidden">
          <Icon name="search" />
          <span>Tìm kiếm...</span>
          <kbd className="ml-auto rounded border border-[#3a3c49] px-1 py-0.5 text-[9px] text-[#676979]">
            ⌘ K
          </kbd>
        </button>
        <button
          className="relative grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-(--text-soft) hover:bg-(--surface-2)"
          onClick={onThemeToggle}
          aria-label="Đổi giao diện"
        >
          <Icon name={mode === "dark" ? "sun" : "moon"} size={20} />
        </button>
        <button
          className="relative grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-(--text-soft) hover:bg-(--surface-2)"
          aria-label="Thông báo"
        >
          <Icon name="bell" size={20} />
          <i className="absolute right-1.75 top-1.75 h-1.25 w-1.25 rounded-full border border-[#15161e] bg-[#f27785]" />
        </button>
      </div>
    </header>
  );
}
