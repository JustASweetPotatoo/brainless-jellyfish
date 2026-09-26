import { useState } from "react";

import type { DashboardPage } from "./core/types";
import { Icon } from "./core/UI";
import type { ServerSummary } from "../../api/dashboardApi";
import { cx, pageCopy, sidebarMotion } from "./mock/dashboardData";

type SidebarProps = {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  servers: ServerSummary[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  userName: string;
  avatar?: string;
  onLogout: () => void;
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export default function DashboardSidebar({
  activePage,
  onNavigate,
  servers,
  selectedServerId,
  onSelectServer,
  userName,
  avatar,
  onLogout,
  open,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const selectedServer = servers.find((server) => server.id === selectedServerId);

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-64.5 flex-col",
        "overflow-hidden border-r border-(--sidebar-border) bg-(--sidebar-bg)",
        "p-[25px_14px_15px] transition-[width,transform] will-change-[width,transform]",
        sidebarMotion,
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        collapsed && "lg:w-20",
      )}
    >
      <div
        className={cx("flex items-center gap-2.5 px-2.5", collapsed && "lg:justify-center lg:px-0")}
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px_12px_12px_4px] bg-[linear-gradient(135deg,#8f72ff,#6951e9)] font-['Plus_Jakarta_Sans'] text-[21px] font-extrabold text-white shadow-[0_8px_22px_#745eff55]">
          S
        </div>
        <div
          className={cx(
            "min-w-0 origin-left overflow-hidden transition-[width,opacity,transform]",
            sidebarMotion,
            collapsed
              ? "lg:pointer-events-none lg:w-0 lg:-translate-x-2 lg:opacity-0"
              : "lg:w-auto lg:translate-x-0 lg:opacity-100",
          )}
        >
          <strong className="block font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-(--text-main)">
            Suwa
          </strong>
          <span className="mt-0.5 block text-[8px] font-bold tracking-[1.2px] text-[#787b90]">
            BOT DASHBOARD
          </span>
        </div>
      </div>
      <div
        className={cx(
          "relative mx-0.5 rounded-xl",
          "border border-(--panel-border) bg-(--surface-2)",
          "transition-[max-height,opacity,transform,margin,padding]",
          sidebarMotion,
          serverMenuOpen && !collapsed && "z-50",
          collapsed
            ? "max-h-0 overflow-hidden -translate-y-2 border-transparent p-0 opacity-0 lg:mb-0 lg:mt-0"
            : "mb-2 mt-5 max-h-20 translate-y-0 overflow-visible opacity-100",
        )}
      >
        <button
          type="button"
          className={cx(
            "flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent p-2.5 text-left",
            "transition-[background-color,border-color] duration-200 ease-out",
            "hover:border-(--panel-border) hover:bg-(--surface-3) disabled:cursor-wait",
          )}
          onClick={() => setServerMenuOpen((openState) => !openState)}
          aria-expanded={serverMenuOpen}
          aria-haspopup="listbox"
          disabled={!selectedServer}
        >
          <span
            className="grid h-8.25 w-8.25 shrink-0 place-items-center rounded-[9px] text-[11px] font-extrabold text-[#eee9ff]"
            style={{
              background: `linear-gradient(135deg, ${selectedServer?.color ?? "#5c3ac4"}, #b864ad)`,
            }}
          >
            {selectedServer?.initials ?? "..."}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[11px] text-(--text-main)">
              {selectedServer?.name ?? "Đang tải server..."}
            </strong>
            <span className="text-[9px] text-(--muted)">{selectedServer?.members ?? ""}</span>
          </span>
          <span
            className={cx(
              "text-(--muted) transition-transform duration-200",
              serverMenuOpen && "rotate-180",
            )}
          >
            ⌄
          </span>
        </button>
        <div
          className={cx(
            "absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-(--panel-border)",
            "bg-(--surface-2) p-1.5 shadow-[0_12px_28px_#00000055]",
            "transition-[opacity,transform,visibility] duration-200 ease-out",
            serverMenuOpen && !collapsed
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-1 opacity-0",
          )}
          role="listbox"
          aria-label="Chọn server"
          aria-hidden={!serverMenuOpen || collapsed}
          inert={!serverMenuOpen || collapsed}
        >
          {servers.map((server) => (
            <button
              type="button"
              key={server.id}
              role="option"
              aria-selected={server.id === selectedServer?.id}
              className={cx(
                "flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent p-2 text-left",
                "transition-[background-color,border-color,color] duration-200 ease-out",
                "hover:border-(--panel-border) hover:bg-(--surface-3)",
                server.id === selectedServer?.id && "border-(--panel-border) bg-(--surface-3)",
              )}
              onClick={() => {
                onSelectServer(server.id);
                setServerMenuOpen(false);
              }}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold text-[#eee9ff]"
                style={{ background: `linear-gradient(135deg, ${server.color}, #b864ad)` }}
              >
                {server.initials}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[10px] text-(--text-main)">
                  {server.name}
                </strong>
                <span className="text-[8px] text-(--muted)">{server.members}</span>
              </span>
              {server.id === selectedServer?.id && (
                <span className="text-xs text-[#65e0a1]">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 scrollbar-thin [scrollbar-color:var(--panel-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--panel-border) [&::-webkit-scrollbar-thumb:hover]:bg-[#735de0]">
        <p
          className={cx(
            "mb-2 ml-3 overflow-hidden whitespace-nowrap text-[9px] font-bold",
            "tracking-[1.2px] text-(--muted) transition-[max-width,opacity,margin]",
            sidebarMotion,
            collapsed ? "lg:ml-0 lg:max-w-0 lg:opacity-0" : "lg:max-w-20 lg:opacity-100",
          )}
        >
          MENU
        </p>
        {(Object.keys(pageCopy) as DashboardPage[]).map((page) => (
          <button
            key={page}
            className={cx(
              "mb-0.5 flex h-10.75 min-h-10.75 w-full items-center gap-3",
              "rounded-[9px] border-0 px-3 text-left text-[13px] text-(--text-soft)",
              "transition-[background-color,color,gap,padding] hover:bg-(--surface-2)",
              "hover:text-(--text-main)",
              sidebarMotion,
              activePage === page &&
                "bg-[linear-gradient(90deg,#735de0,#6850d2)] text-white shadow-[0_7px_17px_#4d3fae33]",
              collapsed && "lg:justify-center lg:gap-0 lg:px-0",
            )}
            onClick={() => onNavigate(page)}
          >
            <span
              className={cx(
                "grid shrink-0 place-items-center text-lg transition-[width,height]",
                sidebarMotion,
                collapsed ? "lg:h-7.25 lg:w-7.25" : "h-6 w-6",
              )}
            >
              <Icon name={page} size={collapsed ? 22 : 18} />
            </span>
            <span
              className={cx(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform]",
                sidebarMotion,
                collapsed
                  ? "lg:max-w-0 lg:translate-x-2 lg:opacity-0"
                  : "lg:max-w-40 lg:translate-x-0 lg:opacity-100",
              )}
            >
              {pageCopy[page].nav}
            </span>
            {page === "modules" && (
              <b
                className={cx(
                  "ml-auto grid h-4.5 min-w-4.5 place-items-center overflow-hidden",
                  "rounded-md bg-[#ffffff18] text-[10px] text-[#e8e2ff]",
                  "transition-[max-width,opacity,margin]",
                  sidebarMotion,
                  collapsed
                    ? "lg:ml-0 lg:max-w-0 lg:min-w-0 lg:opacity-0"
                    : "lg:max-w-6 lg:opacity-100",
                )}
              >
                6
              </b>
            )}
          </button>
        ))}
      </nav>
      <div
        className={cx(
          "mt-auto grid shrink-0 overflow-hidden transition-[max-height,opacity,transform]",
          sidebarMotion,
          collapsed
            ? "max-h-0 translate-y-2 opacity-0"
            : "max-h-32 gap-2 translate-y-0 opacity-100",
        )}
      >
        <div className="flex items-center gap-2 rounded-[10px] border border-[#7659df44] bg-[#7659df14] p-2.5 text-[#c0b1ff]">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7659df33] text-xs">
            ?
          </span>
          <div>
            <strong className="block text-[10px]">Cần trợ giúp?</strong>
            <p className="m-0 mt-0.5 text-[9px] text-[#9d92c2]">Đọc hướng dẫn nhanh</p>
          </div>
        </div>
        <button
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-[10px] border-0 bg-transparent p-2 text-left text-(--text-main) hover:bg-(--surface-2)"
          onClick={onLogout}
        >
          <img className="h-8 w-8 rounded-full bg-(--surface-3) object-cover" src={avatar} alt="" />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[10px]">{userName}</strong>
            <span className="text-[9px] text-(--muted)">Đăng xuất</span>
          </div>
          <Icon name="logout" />
        </button>
      </div>
      <button
        type="button"
        className={cx(
          "mt-3 flex h-8.5 shrink-0 items-center justify-center gap-2 rounded-lg",
          "border border-(--panel-border) bg-(--surface-2) text-(--text-main)",
          "transition-[width,gap]",
          sidebarMotion,
          collapsed ? "lg:mx-auto lg:w-8.5" : "w-full",
        )}
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
        <span
          className={cx(
            "overflow-hidden whitespace-nowrap text-[10px] font-bold",
            "transition-[max-width,opacity,transform]",
            sidebarMotion,
            collapsed
              ? "lg:max-w-0 lg:translate-x-2 lg:opacity-0"
              : "lg:max-w-20 lg:translate-x-0 lg:opacity-100",
          )}
        >
          {collapsed ? "Mở rộng" : "Thu gọn"}
        </span>
      </button>
    </aside>
  );
}
