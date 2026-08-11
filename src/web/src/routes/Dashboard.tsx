import { useState } from "react";
import { Outlet } from "react-router-dom";

import GlobalSideBar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "../components/dashboard/SideBar";
import NavBar from "../components/dashboard/NavBar";
import { useColors } from "../theme";
import NavSidebar from "../components/dashboard/NavSidebar";

function Dashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const colors = useColors();

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div
      className="
        app
        min-h-screen
        w-full
        overflow-x-hidden
      "
      style={{
        backgroundColor: colors.primary[500],
      }}
    >
      <NavBar
        onToggleSidebar={() => {
          setIsCollapsed((prev) => !prev);
        }}
      />
      <GlobalSideBar collapsed={isCollapsed} />
      <main
        className="
          min-h-screen
          min-w-0
          overflow-x-hidden
          overflow-y-auto

          transition-[margin-left,width,background-color]
          duration-300
          ease-in-out
        "
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100vw - ${sidebarWidth}px)`,
          boxSizing: "border-box",
          paddingTop: "56px",
          minHeight: "100vh",
          backgroundColor: colors.primary[400],
        }}
      >
        <div className="w-full min-w-0 max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
