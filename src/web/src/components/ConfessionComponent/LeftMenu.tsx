import { faHome, faMessage, faBookmark, faClock, faUser, faGear, faGlobe, faLightbulb, faRightFromBracket, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "../../redux/hooks";
import { changeTheme } from "../../redux/reducer/slices/ThemeSlices";
import { userHookData } from "../../assets/hooks/hookData";
import UserProfileShortCut from "../UserProfileShortCut";
import { useTranslation } from "react-i18next";

interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly icon?: IconDefinition;
  langKey?: string;
  readonly itemType: "link" | "item" | "button" | "header";
}

const menuItems: MenuItem[] = [
  { id: "confession-l-btn-home", langKey: "confession.menu.home", name: "Trang chủ", path: "/", itemType: "item", icon: faHome },
  { id: "confession-l-btn-messages", langKey: "confession.menu.messages", name: "Tin nhắn", path: "/message", itemType: "item", icon: faMessage },
  { id: "confession-l-btn-saved", langKey: "confession.menu.saved", name: "Đã lưu", path: "/saved", itemType: "item", icon: faBookmark },
  { id: "confession-l-btn-recent", langKey: "confession.menu.recent", name: "Tương tác gần đây", path: "/recent", itemType: "item", icon: faClock },
  { id: "confession-l-btn-settings", langKey: "confession.menu.settings", name: "Cài đặt", path: "/", itemType: "header", icon: faGear },
  { id: "confession-l-btn-account", langKey: "confession.menu.account", name: "Tài khoản", path: "/my-account", itemType: "item", icon: faUser },
  { id: "confession-l-btn-language", langKey: "confession.menu.language", name: "Ngôn ngữ", path: "/language", itemType: "button", icon: faGlobe },
  { id: "confession-l-btn-dark-theme", langKey: "confession.menu.darkTheme", name: "Nền tối", path: "", itemType: "button", icon: faLightbulb },
  { id: "confession-l-btn-logout", langKey: "confession.menu.logout", name: "Đăng xuất", path: "/logout", itemType: "button", icon: faRightFromBracket },
];

const LeftMenu = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [selectedItem, setSelectedItem] = useState("");

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const matched = menuItems.find((itemData) => {
      const fullPath = "/confession" + itemData.path;
      if (itemData.path === "/") {
        return location.pathname === "/confession" || location.pathname === "/confession/";
      }
      return location.pathname.startsWith(fullPath);
    });

    if (matched) setSelectedItem(matched.id);
  }, [location.pathname]);

  const handleButtonClick = (itemId: string) => {
    switch (itemId) {
      case "confession-l-btn-dark-theme":
        dispatch(changeTheme());
        break;
      case "confession-l-btn-language":
        i18n.changeLanguage(i18n.language == "vi" ? "en" : "vi");
        break;
      case "confession-l-btn-logout":
        // TODO: trigger logout
        break;
    }
  };

  return (
    <div className="w-[16rem] py-4">
      <UserProfileShortCut userProfile={{ id: userHookData.id, firstName: "Quang", lastName: "Huy" }} data={userHookData.username} className="flex items-center gap-4 w-full mb-5" />
      <nav className="flex flex-col">
        {menuItems.map((item) => {
          const icon = item.icon ? <FontAwesomeIcon icon={item.icon} className="mr-2 w-[2rem]" /> : null;

          if (item.itemType === "header") {
            return (
              <div key={item.id} className="border-t-1 mt-3 pt-3 mb-3 text-lg border-[#4f4f4f]">
                {icon}
                {t(item.langKey ?? "")}
              </div>
            );
          }

          if (item.itemType === "item") {
            return (
              <Link
                key={item.id}
                to={"/confession" + item.path}
                className={
                  "text-xl my-1 px-4 py-1 rounded-2xl transition-all duration-200 flex items-center text-black dark:text-white" +
                  (selectedItem === item.id ? " bg-[#ff65a0] dark:bg-[#696969] text-white" : " hover:bg-[#d6d6d6] dark:hover:bg-[#383838]")
                }
              >
                {icon}
                {t(item.langKey ?? "")}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleButtonClick(item.id)}
              className={
                "text-xl my-1 px-4 py-1 rounded-2xl flex items-center cursor-pointer transition-colors duration-200 text-black dark:text-white " +
                (selectedItem === item.id ? " bg-gray-200 dark:bg-[#838383]" : " hover:bg-gray-300 dark:hover:bg-[#383838]")
              }
            >
              {icon}
              {t(item.langKey ?? "")}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default LeftMenu;
