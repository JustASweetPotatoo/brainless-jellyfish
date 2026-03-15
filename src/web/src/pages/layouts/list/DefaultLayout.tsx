import { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import type { Layout } from "../common/interface";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket, faUserPlus, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

// import logo from "../../assets/logo2.png";

const Header = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const debug = { loggedIn: false };

  // Tự động đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="min-h-16 min-w-md w-full bg-[hsl(0,0%,30%)] dark:bg-[#1a1a1a] text-white fixed">
      <div className="container min-h-16 mx-auto flex flex-row items-center justify-between">
        <div className="flex">
          <Link to={"/"}>
            <div className="px-5 stroke-text text-2xl font-extrabold flex items-center" id="header-logo">
              {/* <img className="h-40 w-auto object-contain" src={logo} alt="Logo" /> */}
              VPlatform
            </div>
          </Link>

          <div className="relative inline-block text-left lg:hidden" ref={menuRef}>
            {/* Nút mở menu */}
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 text-white rounded hover:bg-[hsl(0,0%,40%)] transition">
              <ChevronRight className={`w-6 h-6 transition-all duration-200 transform ${open ? "rotate-90" : ""}`} />
            </button>

            {/* Dropdown menu */}
            <div
              className={`absolute mt-3 w-[200px] rounded-md shadow-xl bg-transparent transition-all duration-200 transform text-white ${
                open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="font-semibold text-lg w-full text-white transition-all duration-200">
                <a href="/confession" className="flex items-center gap-2 px-4 py-2 rounded-t-lg hover:text-gray-700 bg-[hsl(0,0%,40%)] hover:bg-gray-100 border-b transition-all duration-200">
                  <ChevronRight className="w-5 h-5" />
                  Confession
                </a>
                <a href="/marketplace" className="flex items-center gap-2 px-4 py-2 rounded-b-lg hover:text-gray-700 bg-[hsl(0,0%,40%)] hover:bg-gray-100 transition-all duration-200">
                  <ChevronRight className="w-5 h-5" />
                  Market Place
                </a>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex pl-10 space-x-10 text-xl">
            <Link to={"/confession"} className="items-center hover:font-extrabold cursor-pointer hidden lg:flex">
              <div className="hidden lg:flex">{"> Confession"}</div>
            </Link>
            <Link to={"/marketplace"} className="items-center hover:font-extrabold cursor-pointer hidden lg:flex">
              <div className="hidden lg:flex">{"> Market Place"}</div>
            </Link>
          </nav>
        </div>

        {debug.loggedIn ? (
          <div className="flex space-x-3 text-[15px] font-semibold">
            <button className="lg:px-6 px-4 h-9 transition-all border-2 cursor-pointer hover:bg-white hover:text-[#4f4f4f] rounded-3xl flex items-center bg-[#4f4f4f] text-[#ffffff] space-x-3">
              <div className="hidden lg:flex">ĐĂNG NHẬP</div>
              <FontAwesomeIcon icon={faRightToBracket} />
            </button>
            <button className="lg:px-6 px-4 h-9 transition-all cursor-pointer hover:bg-[#ff65a0] border-0 rounded-3xl flex items-center bg-[#ff3974] space-x-3">
              <div className="hidden lg:flex">ĐĂNG KÝ</div>
              <FontAwesomeIcon icon={faUserPlus} />
            </button>
            <button className="lg:px-3 px-1 h-9 transition-all cursor-pointer hover:bg-white hover:text-[#4f4f4f] rounded-3xl flex items-center bg-[#4f4f4f] text-[#ffffff] space-x-3">
              <FontAwesomeIcon icon={faGlobe} className="pl-2" />
              <div className="hidden lg:flex">VI/VN</div>
            </button>
          </div>
        ) : (
          <></>
        )}
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[hsl(0,0%,30%)] border-t-1 h-[20rem]">
      <div className="container"></div>
    </footer>
  );
};

export const DefaultLayout: Layout = {
  Header: Header,
  Footer: Footer,
  data: { heighMinus: `${4}rem` },
};
