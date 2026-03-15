import layoutCrafter from "./layouts/common/LayoutCrafter";

import { HomePageRouteConfig } from "../routes/config";

const NotFound404Page = () => {
  const MainContent = (
    <section className={"bg-[hsl(0,0%,80%)] dark:bg-[hsl(0,0%,16%)]" + ` min-h-[calc(200vh-4rem)] pt-[4rem] transition-all`}>
      <div className="h-full mx-auto container flex justify-center">
        <h1 className="text-[2rem]">404 Not Found</h1>
      </div>
    </section>
  );

  return layoutCrafter.loadLayout(MainContent, HomePageRouteConfig.layout);
};

export default NotFound404Page;
