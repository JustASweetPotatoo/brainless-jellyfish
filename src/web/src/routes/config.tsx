import type { ComponentType, JSX } from "react";

import type { Layout } from "../pages/layouts/common/interface";
import { HomeLayout } from "../pages/layouts/list/HomeLayout";
import HomePage from "../pages/Home";
import VisualDataPage from "../pages/VisualData";

// export const RouteState = {
//   loggedIn: "logged-in",
//   loggedOut: "logged-out",
//   default: "default",
// };

// export type RouteStateType = keyof typeof RouteState;

export interface RouteConfig {
  readonly path: string;
  readonly id?: string;
  page: ComponentType<{}>;
  layout?: Layout;
  requiredAuth?: boolean;
  element?: JSX.Element;
  children?: RouteConfig[];
}

export const HomePageRouteConfig: RouteConfig = {
  path: "/",
  layout: HomeLayout,
  page: HomePage,
};

export const VisualDataPageRouteConfig: RouteConfig = {
  path: "/",
  layout: HomeLayout,
  page: VisualDataPage,
};

// export const NotFound404RouteConfig: RouteConfig = {
//   path: "*",
//   page: NotFound404Page,
// };

// export const LoginRouteConfig: RouteConfig = {
//   path: "/login",
//   layout: HomeLayout,
//   page: LoginPage,
// };

// export const MarketPlaceRouteConfig: RouteConfig = {
//   path: "/marketplace",
//   layout: MarketPlaceLayout,
//   page: MarketPlace,
// };

// export const ConfessionPageRouteConfig: RouteConfig = {
//   path: "/confession",
//   page: ConfessionPage,
//   children: [
//     {
//       path: "",
//       page: ConfessionHome,
//     },
//     { path: "media/:mediaId", element: <OverlayWrapper />, page: Media },
//     {
//       id: "post-detail",
//       path: ":confessionId",
//       page: PostPage,
//       layout: HomeLayout,
//     },
//     {
//       path: "message",
//       page: () => {
//         return <></>;
//       },
//     },
//     {
//       path: "saved",
//       page: () => {
//         return <></>;
//       },
//     },
//     {
//       path: "recent",
//       page: () => {
//         return <></>;
//       },
//     },
//     {
//       path: "my-account",
//       page: () => {
//         return <></>;
//       },
//     },
//   ],
// };

// const routeConfigList: RouteConfig[] = [LoginRouteConfig, HomePageRouteConfig, ConfessionPageRouteConfig, MarketPlaceRouteConfig, NotFound404RouteConfig];

const routeConfigList: RouteConfig[] = [VisualDataPageRouteConfig];

export default routeConfigList;
