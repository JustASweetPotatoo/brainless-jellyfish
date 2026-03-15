import { Outlet } from "react-router-dom";

const OverlayWrapper = () => {
  return <Outlet context={"overlay"} />;
};

export default OverlayWrapper;
