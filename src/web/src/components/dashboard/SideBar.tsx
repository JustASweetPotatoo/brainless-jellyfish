import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useColors } from "../../theme";

import {
  PeopleIcon,
  ContactsIcon,
  ReceiptIcon,
  PersonIcon,
  CalendarIcon,
  HelpIcon,
  BarChartIcon,
  PieChartIcon,
  TimelineIcon,
  MapIcon,
} from "./icons";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

const dashboardRoute = "/dashboard";
const SIDEBAR_TRANSITION = "0.1s ease-in-out";

interface DashboardRoute {
  title: string;
  to: string;
  icon: ReactNode;
}

const dashboardRouteList: DashboardRoute[] = [
  {
    title: "Overview",
    to: dashboardRoute,
    icon: <BarChartIcon />,
  },
  {
    title: "Manage Team",
    to: `${dashboardRoute}/team`,
    icon: <PeopleIcon />,
  },
  {
    title: "Contacts Information",
    to: `${dashboardRoute}/contacts`,
    icon: <ContactsIcon />,
  },
  {
    title: "Invoices Balances",
    to: `${dashboardRoute}/invoices`,
    icon: <ReceiptIcon />,
  },
  {
    title: "Profile Form",
    to: `${dashboardRoute}/form`,
    icon: <PersonIcon />,
  },
  {
    title: "Calendar",
    to: `${dashboardRoute}/calendar`,
    icon: <CalendarIcon />,
  },
  {
    title: "FAQ Page",
    to: `${dashboardRoute}/faq`,
    icon: <HelpIcon />,
  },
  {
    title: "Bar Chart",
    to: `${dashboardRoute}/bar`,
    icon: <BarChartIcon />,
  },
  {
    title: "Pie Chart",
    to: `${dashboardRoute}/pie`,
    icon: <PieChartIcon />,
  },
  {
    title: "Line Chart",
    to: `${dashboardRoute}/line`,
    icon: <TimelineIcon />,
  },
  {
    title: "Geography Chart",
    to: `${dashboardRoute}/geography`,
    icon: <MapIcon />,
  },
];

interface SideBarItemProps {
  title: string;
  to: string;
  icon: ReactNode;
  selected: string;
  setSelected: (title: string) => void;
  collapsed: boolean;
}

function SideBarItem({ title, to, icon, selected, setSelected, collapsed }: SideBarItemProps) {
  const navigate = useNavigate();
  const colors = useColors();
  const active = selected === title;

  const handleClick = () => {
    setSelected(title);
    navigate(to);
  };

  useEffect(() => {
    if (active) {
      document.title = `${title} - My App`;
    }
  }, [active, title]);

  return (
    <MenuItem
      active={active}
      icon={icon}
      onClick={handleClick}
      rootStyles={{
        minWidth: 0,
        overflow: "hidden",
        color: active ? colors.blueAccent[500] : colors.grey[100],
        backgroundColor: active ? colors.primary[400] : colors.primary[500],
        borderRadius: "6px",
        margin: 0,
        transition: `background-color ${SIDEBAR_TRANSITION}, color ${SIDEBAR_TRANSITION}, margin ${SIDEBAR_TRANSITION}`,

        "& .ps-menu-button": {
          minWidth: 0,
          overflow: "hidden",
          transition: `padding ${SIDEBAR_TRANSITION}, background-color ${SIDEBAR_TRANSITION}, color ${SIDEBAR_TRANSITION}`,
        },

        "& .ps-menu-icon": {
          flexShrink: 0,
          transition: `margin ${SIDEBAR_TRANSITION}, width ${SIDEBAR_TRANSITION}, min-width ${SIDEBAR_TRANSITION}`,
        },

        "& .ps-menu-label": {
          display: "block",
          minWidth: 0,
          width: collapsed ? "0px" : "auto",
          maxWidth: collapsed ? "0px" : "100%",
          flex: collapsed ? "0 0 0px" : "1 1 auto",
          opacity: collapsed ? 0 : 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          margin: 0,
          padding: 0,
          transition: `width ${SIDEBAR_TRANSITION}, max-width ${SIDEBAR_TRANSITION}, flex ${SIDEBAR_TRANSITION}, opacity ${SIDEBAR_TRANSITION}, margin ${SIDEBAR_TRANSITION}`,
        },

        "& .ps-menu-label span": {
          display: "block",
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
        },

        "&:hover": {
          backgroundColor: `${colors.primary[400]} !important`,
          color: `${colors.blueAccent[500]} !important`,
        },
      }}
    >
      <span className="block min-w-0 overflow-hidden whitespace-nowrap text-sm">{title}</span>
    </MenuItem>
  );
}

interface SideBarItemsProps {
  selected: string;
  setSelected: (title: string) => void;
  collapsed: boolean;
}

function SideBarItems({ selected, setSelected, collapsed }: SideBarItemsProps) {
  return (
    <div className="w-full pt-2">
      {dashboardRouteList.map((route) => (
        <SideBarItem
          key={route.to}
          title={route.title}
          to={route.to}
          icon={route.icon}
          selected={selected}
          setSelected={setSelected}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

export interface SideBarProfileViewProps {
  collapsed: boolean;
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
}

const SideBarProfileView: React.FC<SideBarProfileViewProps> = ({ collapsed }) => {
  const colors = useColors();

  return (
    <div
      className="h-full w-full overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: colors.primary[500],
      }}
    >
      <div className="w-full px-2 pt-3">
        <div
          className="flex w-full items-center justify-center transition-all duration-300 ease-in-out"
          style={{
            height: collapsed ? "55px" : "90px",
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}serverTestIco.png`}
            alt="profile-user"
            className="cursor-pointer rounded-full object-cover transition-all duration-300"
            style={{
              width: collapsed ? "42px" : "72px",
              height: collapsed ? "42px" : "72px",
            }}
          />
        </div>

        <div
          className="overflow-hidden text-center transition-all duration-300"
          style={{
            maxHeight: collapsed ? "0px" : "70px",
            opacity: collapsed ? 0 : 1,
          }}
        >
          <p
            className="m-0 mt-2 whitespace-nowrap text-lg font-bold"
            style={{
              color: colors.grey[100],
            }}
          >
            Thiên Hà Của Sứa
          </p>

          <p
            className="m-0 mt-1 whitespace-nowrap text-xs"
            style={{
              color: colors.greenAccent[500],
            }}
          >
            User session: Test
          </p>
        </div>
      </div>
    </div>
  );
};

interface GlobalSideBarProps {
  collapsed?: boolean;
}

function GlobalSideBar({ collapsed = false }: GlobalSideBarProps) {
  const colors = useColors();
  const location = useLocation();

  const [selected, setSelected] = useState("Overview");

  useEffect(() => {
    const currentRoute = dashboardRouteList.find((route) => route.to === location.pathname);

    if (currentRoute) {
      setSelected(currentRoute.title);
    }
  }, [location.pathname]);

  const sidebarRootStyles = useMemo(
    () => ({
      position: "fixed" as const,
      top: "56px",
      left: "0",
      bottom: "0",
      height: "calc(100vh - 56px)",
      border: "none",
      zIndex: 40,
      overflow: "hidden",

      "& .ps-sidebar-container": {
        width: collapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
        minWidth: collapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
        height: "100%",
        overflow: "hidden",
        backgroundColor: colors.primary[500],
        transition: `width ${SIDEBAR_TRANSITION}, min-width ${SIDEBAR_TRANSITION}`,
      },

      "& .ps-menu-root": {
        width: "100%",
        margin: 0,
        padding: 0,
      },

      "& .ps-menuitem-root": {
        minWidth: 0,
        width: "100%",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        transition: `all ${SIDEBAR_TRANSITION}`,
      },

      "& .ps-menu-button": {
        minWidth: 0,
        overflow: "hidden",
        transition: `padding-left ${SIDEBAR_TRANSITION}, padding-right ${SIDEBAR_TRANSITION}, background-color ${SIDEBAR_TRANSITION}, color ${SIDEBAR_TRANSITION}`,
      },

      "& .ps-menu-icon": {
        flexShrink: 0,
        transition: `margin ${SIDEBAR_TRANSITION}, width ${SIDEBAR_TRANSITION}, min-width ${SIDEBAR_TRANSITION}`,
      },

      "& .ps-menu-label": {
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: `opacity ${SIDEBAR_TRANSITION}, width ${SIDEBAR_TRANSITION}, max-width ${SIDEBAR_TRANSITION}, margin ${SIDEBAR_TRANSITION}`,
      },
    }),
    [collapsed, colors.primary],
  );

  return (
    <aside
      className="fixed left-0 z-40 transition-colors duration-300 ease-in-out"
      style={{
        top: "56px",
        height: "calc(100vh - 56px)",
        backgroundColor: colors.primary[500],
      }}
    >
      <Sidebar
        collapsed={collapsed}
        width={`${SIDEBAR_WIDTH}px`}
        collapsedWidth={`${SIDEBAR_COLLAPSED_WIDTH}px`}
        rootStyles={sidebarRootStyles}
      >
        <Menu
          className="h-[calc(100vh-56px)]"
          menuItemStyles={{
            button: {
              minWidth: 0,
              overflow: "hidden",
              transition: "background-color 0.1s ease-in-out, color 0.1s ease-in-out, padding 0.1s ease-in-out",
              "&:hover": {
                backgroundColor: colors.primary[400],
                color: colors.blueAccent[500],
              },
            },
          }}
        >
          <div className="h-full w-full overflow-hidden transition-colors duration-300">
            <SideBarProfileView
              collapsed={collapsed}
              selected={selected}
              setSelected={setSelected}
            ></SideBarProfileView>

            <SideBarItems selected={selected} setSelected={setSelected} collapsed={collapsed} />
          </div>
        </Menu>
      </Sidebar>
    </aside>
  );
}

export default GlobalSideBar;
