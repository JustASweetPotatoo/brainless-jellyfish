import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { useColorMode } from "../theme";
import { initialModules } from "../components/dashboard/core/moduleData";
import type { DashboardPage } from "../components/dashboard/core/types";
import { Icon } from "../components/dashboard/core/UI";
import ModulesPanel from "../components/dashboard/pages/ModulesPanel";
import OverviewPanel from "../components/dashboard/pages/OverviewPanel";
import SettingsPanel from "../components/dashboard/pages/SettingsPanel";
import StatisticsPanel from "../components/dashboard/pages/StatisticsPanel";

const pageCopy: Record<DashboardPage, { title: string; subtitle: string; nav: string }> = {
  overview: {
    title: "Tổng quan",
    subtitle: "Theo dõi sức khoẻ bot và hoạt động của máy chủ.",
    nav: "Tổng quan",
  },
  modules: {
    title: "Quản lý module",
    subtitle: "Bật hoặc tắt các tính năng của bot cho máy chủ này.",
    nav: "Quản lý module",
  },
  statistics: {
    title: "Thống kê máy chủ",
    subtitle: "Nhìn lại mức tăng trưởng và mức độ tương tác của cộng đồng.",
    nav: "Thống kê",
  },
  settings: {
    title: "Cài đặt máy chủ",
    subtitle: "Thiết lập các tuỳ chọn cơ bản cho bot và kênh thông báo.",
    nav: "Cài đặt",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modules, setModules] = useState(initialModules);
  const activeCopy = useMemo(() => pageCopy[activePage], [activePage]);

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
  const toggleModule = (id: string) =>
    setModules((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );

  return (
    <div className="dashboard-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={changePage}
        userName={user?.displayName ?? "Administrator"}
        avatar={user?.avatar}
        onLogout={() => void logout()}
        open={sidebarOpen}
      />
      <div
        className={`backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <main>
        <Topbar
          pageTitle={activeCopy.title}
          mode={mode}
          onMenu={() => setSidebarOpen(true)}
          onThemeToggle={toggleColorMode}
        />
        <div className="main-content">
          <div className="page-heading">
            <div>
              <h1>{activeCopy.title}</h1>
              <p>{activeCopy.subtitle}</p>
            </div>
            <div className="server-status">
              <span className="live-dot" /> Bot đang online <b>•</b> 42ms
            </div>
          </div>
          <PageContent page={activePage} modules={modules} onToggleModule={toggleModule} />
        </div>
      </main>
    </div>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  userName,
  avatar,
  onLogout,
  open,
}: {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  userName: string;
  avatar?: string;
  onLogout: () => void;
  open: boolean;
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <strong>Suwa</strong>
          <span>BOT DASHBOARD</span>
        </div>
      </div>
      <div className="server-switcher">
        <div className="server-mini">TH</div>
        <div>
          <strong>Thiên Hà Của Sữa</strong>
          <span>8,429 thành viên</span>
        </div>
        <span className="chevron">⌄</span>
      </div>
      <nav>
        <p>MENU</p>
        {(Object.keys(pageCopy) as DashboardPage[]).map((page) => (
          <button
            key={page}
            className={activePage === page ? "active" : ""}
            onClick={() => onNavigate(page)}
          >
            <Icon name={page} />
            <span>{pageCopy[page].nav}</span>
            {page === "modules" && <b>6</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="help-card">
          <span>?</span>
          <div>
            <strong>Cần trợ giúp?</strong>
            <p>Đọc hướng dẫn nhanh</p>
          </div>
        </div>
        <button className="user-card" onClick={onLogout}>
          <img src={avatar} alt="" />
          <div>
            <strong>{userName}</strong>
            <span>Đăng xuất</span>
          </div>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  pageTitle,
  mode,
  onMenu,
  onThemeToggle,
}: {
  pageTitle: string;
  mode: string;
  onMenu: () => void;
  onThemeToggle: () => void;
}) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Mở menu">
        <Icon name="menu" size={22} />
      </button>
      <div className="breadcrumb">
        <span>Dashboard</span>
        <i>/</i>
        <strong>{pageTitle}</strong>
      </div>
      <div className="top-actions">
        <button className="search-button">
          <Icon name="search" />
          <span>Tìm kiếm...</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button" onClick={onThemeToggle} aria-label="Đổi giao diện">
          <Icon name={mode === "dark" ? "sun" : "moon"} size={20} />
        </button>
        <button className="icon-button notification" aria-label="Thông báo">
          <Icon name="bell" size={20} />
          <i />
        </button>
      </div>
    </header>
  );
}

function PageContent({
  page,
  modules,
  onToggleModule,
}: {
  page: DashboardPage;
  modules: typeof initialModules;
  onToggleModule: (id: string) => void;
}) {
  if (page === "overview") return <OverviewPanel modules={modules} onToggle={onToggleModule} />;
  if (page === "modules") return <ModulesPanel modules={modules} onToggle={onToggleModule} />;
  if (page === "statistics") return <StatisticsPanel />;
  return <SettingsPanel />;
}
