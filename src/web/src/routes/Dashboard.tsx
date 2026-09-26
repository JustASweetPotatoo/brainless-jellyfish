import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { initialModules } from "../components/dashboard/core/moduleData";
import type { DashboardPage } from "../components/dashboard/core/types";
import ModulesPanel from "../components/dashboard/pages/ModulesPanel";
import OverviewPanel from "../components/dashboard/pages/OverviewPanel";
import SettingsPanel from "../components/dashboard/pages/SettingsPanel";
import StatisticsPanel from "../components/dashboard/pages/StatisticsPanel";
import { usePushNotification } from "../components/PushNotificationProvider";
import Topbar from "../components/dashboard/Topbar";
import { cx, pageCopy, sidebarMotion } from "../components/dashboard/mock/dashboardData";
import { useColorMode } from "../theme";
import {
  getServerStats,
  getServerModules,
  getServers,
  updateServerModule,
  type DashboardStats,
  type ServerSummary,
} from "../api/dashboardApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const selectedServerIdRef = useRef<string | null>(null);
  const [modules, setModules] = useState(initialModules);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { notify } = usePushNotification();
  const activeCopy = useMemo(() => pageCopy[activePage], [activePage]);

  useEffect(() => {
    let active = true;
    getServers()
      .then((items) => {
        if (!active) return;
        setServers(items);
        const defaultId = items[0]?.id ?? null;
        selectedServerIdRef.current = defaultId;
        setSelectedServerId(defaultId);
      })
      .catch((error: unknown) => {
        if (active) {
          notify(
            error instanceof Error ? error.message : "Không tải được danh sách server",
            "error",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    if (!selectedServerId) return;

    const controller = new AbortController();
    setModulesLoading(true);
    setStatsLoading(true);
    setModules([]);
    setStats(null);
    Promise.all([
      getServerModules(selectedServerId, controller.signal),
      getServerStats(selectedServerId, controller.signal),
    ])
      .then(([moduleItems, serverStats]) => {
        setModules(moduleItems);
        setStats(serverStats);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          notify(error instanceof Error ? error.message : "Không tải được dữ liệu server", "error");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setModulesLoading(false);
          setStatsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedServerId, notify]);

  useEffect(() => {
    const segment = location.pathname.split("/").at(-1);
    const page = segment && segment in pageCopy ? (segment as DashboardPage) : "overview";
    setActivePage(page);
  }, [location.pathname]);

  const changePage = (page: DashboardPage) => {
    setActivePage(page);
    setSidebarOpen(false);
    navigate(page === "overview" ? "/dashboard" : `/dashboard/${page}`);
  };

  const selectServer = (serverId: string) => {
    selectedServerIdRef.current = serverId;
    setSelectedServerId(serverId);
  };

  const toggleModule = async (id: string) => {
    const serverId = selectedServerId;
    const target = modules.find((item) => item.id === id);

    if (!serverId || !target || target.pending) {
      return;
    }

    setModules((items) =>
      items.map((item) => (item.id === id ? { ...item, pending: true } : item)),
    );

    try {
      const updated = await updateServerModule(serverId, id, !target.enabled);
      if (selectedServerIdRef.current === serverId) {
        setModules((items) =>
          items.map((item) => (item.id === id ? { ...updated, pending: false } : item)),
        );
      }
      notify(`${target.name} đã ${updated.enabled ? "bật" : "tắt"} thành công`, "success");
    } catch (error) {
      if (selectedServerIdRef.current === serverId) {
        setModules((items) =>
          items.map((item) => (item.id === id ? { ...item, pending: false } : item)),
        );
      }
      notify(error instanceof Error ? error.message : "Không thể cập nhật module", "error");
    }
  };

  return (
    <div className="min-h-screen bg-(--dashboard-bg) text-(--text-main)">
      <DashboardSidebar
        activePage={activePage}
        onNavigate={changePage}
        servers={servers}
        selectedServerId={selectedServerId}
        onSelectServer={selectServer}
        userName={user?.displayName ?? "Administrator"}
        avatar={user?.avatar}
        onLogout={() => void logout()}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={cx(
          "fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <main
        className={cx(
          "min-h-screen max-lg:ml-0 lg:ml-(--sidebar-offset)",
          "transition-[margin-left]",
          sidebarMotion,
        )}
        style={{ "--sidebar-offset": sidebarCollapsed ? "80px" : "258px" } as CSSProperties}
      >
        <Topbar
          pageTitle={activeCopy.title}
          mode={mode}
          onMenu={() => setSidebarOpen(true)}
          onThemeToggle={toggleColorMode}
        />

        <div className="mx-auto max-w-365 px-5 pb-13 pt-7 sm:px-10">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h1 className="m-0 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.8px] text-(--text-main)">
                {activeCopy.title}
              </h1>
              <p className="m-0 mt-2 text-xs text-(--muted)">{activeCopy.subtitle}</p>
            </div>
            <div className="rounded-[7px] border border-(--panel-border) bg-(--panel-bg) px-2.5 py-1.5 text-[10px] text-(--muted)">
              <span className="mr-1.5 inline-block h-1.75 w-1.75 rounded-full bg-[#55d59a] shadow-[0_0_0_3px_#55d59a18]" />{" "}
              Bot đang online <b className="mx-1.5 text-[#565867]">•</b> 42ms
            </div>
          </div>
          <PageContent
            page={activePage}
            serverId={selectedServerId}
            serverName={servers.find((server) => server.id === selectedServerId)?.name ?? "server"}
            stats={stats}
            statsLoading={statsLoading}
            modules={modules}
            modulesLoading={modulesLoading}
            onStatsUpdate={setStats}
            onToggleModule={toggleModule}
          />
        </div>
      </main>
    </div>
  );
}

function PageContent({
  page,
  serverId,
  serverName,
  stats,
  statsLoading,
  modules,
  modulesLoading,
  onStatsUpdate,
  onToggleModule,
}: {
  page: DashboardPage;
  serverId: string | null;
  serverName: string;
  stats: DashboardStats | null;
  statsLoading: boolean;
  modules: typeof initialModules;
  modulesLoading: boolean;
  onStatsUpdate: (stats: DashboardStats) => void;
  onToggleModule: (id: string) => Promise<void> | void;
}) {
  if (page === "overview") {
    return statsLoading || !stats ? (
      <p className="text-sm text-(--muted)" role="status">
        Đang tải dữ liệu server...
      </p>
    ) : (
      <OverviewPanel
        serverName={serverName}
        stats={stats}
        modules={modules}
        onToggle={onToggleModule}
      />
    );
  }
  if (page === "modules") {
    return modulesLoading ? (
      <p className="text-sm text-(--muted)" role="status">
        Đang tải module...
      </p>
    ) : (
      <ModulesPanel modules={modules} onToggle={onToggleModule} />
    );
  }
  if (page === "statistics") {
    return statsLoading || !stats || !serverId ? (
      <p className="text-sm text-(--muted)" role="status">
        Đang tải thống kê...
      </p>
    ) : (
      <StatisticsPanel
        serverId={serverId}
        serverName={serverName}
        stats={stats}
        onStatsUpdate={onStatsUpdate}
      />
    );
  }
  if (page === "audit-log") return <AuditLogPanel />;
  return <SettingsPanel />;
}

function AuditLogPanel() {
  const entries = [
    {
      time: "2 phút trước",
      actor: "Administrator",
      action: "Cập nhật nhãn kênh #general",
      detail: "Đã đổi thông báo mặc định",
    },
    {
      time: "18 phút trước",
      actor: "Moonlight",
      action: "Bật module Welcome",
      detail: "Đã kích hoạt chào mừng thành viên mới",
    },
    {
      time: "1 giờ trước",
      actor: "Administrator",
      action: "Thay đổi cài đặt kiểm duyệt",
      detail: "Tăng mức cảnh báo cho nội dung nhạy cảm",
    },
    {
      time: "Hôm qua",
      actor: "System",
      action: "Tạo lịch ghi nhật ký",
      detail: "Đã lưu cấu hình máy chủ mới",
    },
  ];

  return (
    <section className="rounded-[14px] border border-(--panel-border) bg-(--panel-bg) p-6 shadow-[0_10px_26px_var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-[13px] text-(--text-main)">Nhật ký chỉnh sửa</h3>
          <p className="m-0 mt-1 text-[10px] text-(--muted)">
            Lịch sử các thay đổi gần đây trong máy chủ
          </p>
        </div>
        <button className="rounded-lg border border-(--panel-border) bg-(--surface-2) px-2.5 py-1.5 text-[10px] text-(--text-soft)">
          Mới nhất
        </button>
      </div>

      <div className="mt-4.5 grid gap-3.5">
        {entries.map((entry, index) => (
          <div
            key={`${entry.time}-${index}`}
            className="rounded-[10px] border border-(--panel-border) bg-(--surface-2) p-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-xs text-(--text-main)">{entry.action}</strong>
              <span className="text-[10px] text-(--muted)">{entry.time}</span>
            </div>
            <p className="m-0 mt-2 text-[11px] text-(--text-soft)">
              {entry.actor} · {entry.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
