import type React from "react";
import type { LayoutKey } from "../App";

export interface LayoutProps {
  readonly path: string;
  readonly layout: string;
  readonly content: React.JSX.Element;
}

export const LayoutType = {
  dashboard: "dashboard",
  default: "default",
};

export interface RouteData {
  path: string;
  layout: LayoutKey;
  element: React.JSX.Element; 
}


