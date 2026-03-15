import { useEffect, useState } from "react";
import { defineState } from "../auth/utils";
import layoutCrafter from "./layouts/common/LayoutCrafter";
import { VisualDataPageRouteConfig } from "../routes/config";

import MessageRateLineChart from "../components/chart/MessageRateLineChart";

const VisualDataPage = () => {
  const [, setRouteState] = useState(defineState(VisualDataPageRouteConfig));

  const MainContent = (
    <section
      className={
        "bg-[hsl(0,0%,80%)] dark:bg-[hsl(0,0%,16%)] pt-16 min-h-[100vh] transition-all"
      }
    >
      <MessageRateLineChart id="memaybeo" data={[]} />
    </section>
  );

  useEffect(() => {
    setRouteState(defineState(VisualDataPageRouteConfig));
  }, []);

  return layoutCrafter.loadLayout(MainContent, VisualDataPageRouteConfig.layout);
};

export default VisualDataPage;
