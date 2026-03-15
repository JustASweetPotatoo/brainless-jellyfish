import type { JSX } from "react";
import { Route } from "react-router-dom";
import routeConfigList, { type RouteConfig } from "./config";

class RouteRenderer {
  public renderRoutes(): JSX.Element[] {
    return routeConfigList.map((cfg) => this.renderRoute(cfg));
  }

  private renderRoute(cfg: RouteConfig): JSX.Element {
    const PageComp = cfg.page;

    return (
      <Route key={cfg.path} path={cfg.path} element={<PageComp />}>
        {cfg.children?.map((ch) => {
          const ChildComp = ch.page;
          return <Route key={`${cfg.path}/${ch.path}`} path={ch.path} element={<ChildComp />} />;
        })}
      </Route>
    );
  }
}

export const routerRender = new RouteRenderer();
export default RouteRenderer;
