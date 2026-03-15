import layoutCrafter from "./layouts/common/LayoutCrafter";
import { HomeLayout } from "./layouts/list/HomeLayout";
import { defineState } from "../auth/utils";
import { LoginRouteConfig } from "../routes/config";
import { useEffect, useState, type JSX } from "react";

const LoginPage = () => {
  const [routeState, setRouteState] = useState(defineState(LoginRouteConfig));
  // const dispatch = useAppDispatch();

  useEffect(() => {
    setRouteState(defineState(LoginRouteConfig));
  }, []);

  const MainContent: JSX.Element = <></>;

  return layoutCrafter.loadLayout(MainContent, LoginRouteConfig.layout);
};

export default LoginPage;
