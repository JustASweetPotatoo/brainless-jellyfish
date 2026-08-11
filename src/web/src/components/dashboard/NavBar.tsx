import { useContext } from "react";
import { DarkModeIcon, LightModeIcon, MenuIcon, NotificationsIcon, SearchIcon, SettingsIcon } from "./icons";
import { ColorModeContext } from "../../theme";

interface TopNavBarProps {
  onToggleSidebar?: () => void;
}

function NavBar({ onToggleSidebar }: TopNavBarProps) {
  const colorMode = useContext(ColorModeContext);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-primary-400 text-grey-100 border-b border-primary-500 shadow-sm min-h-15 px-2">
      {/* Logo + tên */}
      <div className="flex items-center gap-0.5">
        <button onClick={onToggleSidebar} className="p-1.5 mr-0.5 rounded hover:bg-primary-500/20 transition-colors">
          <MenuIcon />
        </button>
        <img
          alt="logo"
          src={`${import.meta.env.BASE_URL}serverTestIco.png`}
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
        <div>
          <p className="px-5 text-base font-bold leading-tight">Thiên Hà Của Sứa</p>
          {/* <p className="text-xs leading-tight text-green-500">SuwaClient Dashboard</p> */}
        </div>

        <div className="flex bg-primary-300 rounded-[3px]">
          <input
            className="ml-2 flex-1 bg-transparent outline-none text-grey-100 placeholder:text-grey-600"
            placeholder="Search"
          />
          <button type="button" className="p-1">
            <SearchIcon />
          </button>
        </div>
      </div>

      {/* Hành động + user */}
      <div className="flex items-center gap-0.5">
        <button onClick={colorMode.toggleColorMode} className="p-1.5 rounded hover:bg-primary-500/20 transition-colors">
          {colorMode.mode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
        </button>
        <button className="p-1.5 rounded hover:bg-primary-500/20 transition-colors">
          <NotificationsIcon />
        </button>
        <button className="p-1.5 rounded hover:bg-primary-500/20 transition-colors">
          <SettingsIcon />
        </button>
        <div className="flex items-center gap-1 ml-1 cursor-pointer">
          <img
            alt="user"
            src={`${import.meta.env.BASE_URL}serverTestIco.png`}
            width={32}
            height={32}
            className="rounded-full bg-primary-600 object-cover"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight">Test User</p>
            <p className="text-xs leading-tight text-grey-300">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
