import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket, faUserPlus, faGlobe, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { Layout } from "../common/interface";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";

const mockResults = ["React", "Tailwind", "TypeScript", "Next.js", "Lucide Icons"];

const Header = () => {
  const [search, setSearch] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const displayingMedia = useSelector((state: RootState) => state.displayingMedialSlice);

  const [mediaDisplaying, setMediaDisplaying] = useState(displayingMedia.mediaId != undefined);

  useEffect(() => {
    if (displayingMedia.mediaId) {
      setMediaDisplaying(true);
    } else {
      setMediaDisplaying(false);
    }
  }, [displayingMedia]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setIsSearchLoading(false); // reset loading nếu xóa input
      return;
    }

    setIsSearchLoading(true);
    const timeout = setTimeout(() => {
      setIsSearchLoading(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, [search]);

  const filteredResults = search.trim() ? mockResults.filter((r) => r.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <header className="w-full min-h-16 bg-[#4d4d4d] dark:bg-[#1a1a1a] text-white fixed z-50 border-1 border-[#4f4f4f]">
      <div className="w-full h-16 flex items-center justify-between">
        {/* "Logo" */}
        <div className="w-[30rem] pl-10">
          <Link to={"/"} className="w-fit flex">
            <div className="w-fit px-4 text-2xl font-extrabold whitespace-nowrap" id="header-logo">
              {/* <img className="h-40 w-auto object-contain" src={logo} alt="Logo" /> */}
              VPlatform
            </div>
          </Link>
        </div>

        <div className="w-[20rem] flex items-center gap-4 flex-1 max-w-4xl min-h-full">
          <div ref={searchRef} className={`relative flex-1` + (mediaDisplaying ? " hidden" : "")}>
            <div className={`flex items-center px-4 py-1 h-[2rem] rounded-3xl transition-all duration-200 ${focused ? "bg-white" : "bg-gray-300"}`}>
              <input
                type="text"
                value={search}
                onFocus={() => setFocused(true)}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="w-full bg-transparent focus:outline-none text-black font-semibold text-sm"
              />
              <button className="flex items-center cursor-pointer">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-2 text-gray-600 text-base" />
              </button>
            </div>

            {focused && search.trim().length > 0 && (
              <div
                className={`
                  absolute left-0 right-0 mt-1 bg-white rounded-md shadow-md max-h-60 overflow-y-auto z-10
                  transition-all duration-200 ease-in-out transform
                  ${isSearchLoading || filteredResults.length > 0 || search.trim().length > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
                `}
              >
                {isSearchLoading ? (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">Đang tìm kiếm...</div>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((item, index) => (
                    <div
                      key={index}
                      onMouseDown={() => {
                        setSearch(item);
                        setFocused(false);
                      }}
                      className={`px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer ${index + 1 !== filteredResults.length ? "border-b" : ""}`}
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">Không có kết quả nào, hãy thử cụm từ khác!</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-[30rem] flex justify-end pr-10 items-center space-x-3 font-semibold text-sm">
          <button className="lg:px-6 px-4 h-9 border-2 rounded-3xl cursor-pointer flex items-center space-x-2 tex t-white hover:bg-white hover:text-[#4f4f4f] transition-all">
            <span className="hidden lg:flex">ĐĂNG NHẬP</span>
            <FontAwesomeIcon icon={faRightToBracket} />
          </button>
          <button className="lg:px-6 px-4 h-9 rounded-3xl cursor-pointer flex items-center space-x-2 bg-[#ff3974] hover:bg-[#ff65a0] text-white transition-all">
            <span className="hidden lg:flex">ĐĂNG KÝ</span>
            <FontAwesomeIcon icon={faUserPlus} />
          </button>
          <button className="px-3 h-9 rounded-3xl cursor-pointer flex items-center space-x-2  hover:bg-white hover:text-[#4f4f4f] text-white transition-all">
            <FontAwesomeIcon icon={faGlobe} />
            <span className="hidden lg:flex">VI/VN</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="text-center h-[4rem] flex items-center justify-center text-gray-100 bg-[hsl(0,0%,30%)]">
      <div className="containter">© 2025 VPlatform</div>
    </footer>
  );
};

export const ConfessionHomeLayout: Layout = { Header: Header, Footer: Footer, data: {} };
