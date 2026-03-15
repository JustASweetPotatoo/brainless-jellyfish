import React, { Fragment, type JSX } from "react";
import type { Layout } from "./interface";
import type { RouteStateType } from "../../../routes/config";
import { useAppSelector } from "../../../redux/hooks";
import { DefaultLayout } from "../list/DefaultLayout";

class LayoutCrafter {
  loadLayout(Content: JSX.Element, layout?: Layout, _pageRenderState?: RouteStateType): React.ReactNode {
    let Header = layout ? layout.Header : DefaultLayout.Header;
    let Footer = layout ? layout.Footer : DefaultLayout.Footer;

    const theme = useAppSelector((state) => state.themeSlice);

    return (
      <Fragment>
        <div className={`${theme.mode} min-h-screen w-full overflow-x-hidden`}>
          <Header />
          {Content}
          <Footer />
        </div>
      </Fragment>
    );
  }
}

const layoutCrafter = new LayoutCrafter();

export default layoutCrafter;
