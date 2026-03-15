import layoutCrafter from "./layouts/common/LayoutCrafter";
import { useEffect, useState } from "react";
import { defineState } from "../auth/utils";
import { MarketPlaceRouteConfig } from "../routes/config";
import { changeTheme } from "../redux/reducer/slices/ThemeSlices";
import { useAppDispatch } from "../redux/hooks";
import { MarketPlaceLayout } from "./layouts/list/MarketPlaceLayout";

const MarketPlace = () => {
  const [routeState, setRouteState] = useState(defineState(MarketPlaceRouteConfig));
  const dispatch = useAppDispatch();

  const handleCounterButton = (_e: React.MouseEvent<HTMLButtonElement>) => {
    dispatch(changeTheme());
  };

  const MainContent = (
    <section className={"bg-[hsl(0,0%,80%)] dark:bg-[hsl(0,0%,16%)]" + ` min-h-[calc(200vh-4rem)] transition-all`}>
      <button className="border bg-gray-300" onClick={handleCounterButton}>
        {"button"}
      </button>
      <h1>Hello</h1>
    </section>
  );

  useEffect(() => {
    setRouteState(defineState(MarketPlaceRouteConfig));
  }, []);

  return layoutCrafter.loadLayout(MainContent, MarketPlaceRouteConfig.layout);
};

export default MarketPlace;
