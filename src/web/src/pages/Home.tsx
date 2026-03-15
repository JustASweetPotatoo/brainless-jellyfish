import { useEffect, useState } from "react";

import layoutCrafter from "./layouts/common/LayoutCrafter";
import { defineState } from "../auth/utils";
import { HomePageRouteConfig } from "../routes/config";
// import { changeTheme } from "../redux/reducer/slices/ThemeSlices";
// import { useAppDispatch } from "../redux/hooks";

const HomePage = () => {
  const [, setRouteState] = useState(defineState(HomePageRouteConfig));
  // const dispatch = useAppDispatch();

  // const handleCounterButton = (_e: React.MouseEvent<HTMLButtonElement>) => {
  //   dispatch(changeTheme());
  // };

  const MainContent = (
    <section
      className={
        "bg-[hsl(0,0%,80%)] dark:bg-[hsl(0,0%,16%)] pt-16 min-h-[100vh] transition-all"
      }
    >
      <div className="w-full flex justify-center min-h-[calc(100vh-4rem)]">
        <div className="container px-auto text-white">
          <div className="h-2/3 flex items-center">
            <div className="w-2/3">
              <div className="px-5 stroke-text text-7xl py-8 font-extrabold flex items-center">
                VPlatform
              </div>
              <div className="text-5xl py-4 flex items-center">
                Platform dành cho Vtuber
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  useEffect(() => {
    setRouteState(defineState(HomePageRouteConfig));
  }, []);

  return layoutCrafter.loadLayout(MainContent, HomePageRouteConfig.layout);
};

export default HomePage;
