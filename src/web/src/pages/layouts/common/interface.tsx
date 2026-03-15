import type { FC } from "react";
import type { RouteStateType } from "../../../routes/config";

export interface Layout {
  Header: FC;
  Footer: FC;
  data?: any;
}

export interface LayoutData {
  routeState: RouteStateType;
  userData?: any;
}
