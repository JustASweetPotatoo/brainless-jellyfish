import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Layout, LayoutData } from "../common/interface";
import { faGlobe, faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="min-h-16 min-w-full w-full bg-[hsl(0,0%,30%)] dark:bg-[#1a1a1a] text-white fixed">
      <div className="container min-h-16 mx-auto flex flex-row items-center justify-between">
        <div className="flex">
          <Link to={"/"}>
            <div className="px-5 stroke-text text-2xl font-extrabold flex items-center" id="header-logo">
              {/* <img className="h-40 w-auto object-contain" src={logo} alt="Logo" /> */}
              VPlatform
            </div>
          </Link>
        </div>

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
      </div>
    </header>
  );
};

const Footer = () => {
  return <footer></footer>;
};

export const MarketPlaceLayout: Layout = { Header: Header, Footer: Footer, data: {} };
