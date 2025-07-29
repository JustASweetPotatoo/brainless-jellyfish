import type { LayoutProps } from "./interface";

const DefaultLayout = ({ content }: LayoutProps) => {
  return (
    <>
      <header></header>
      <main>{content}</main>
    </>
  );
};

export default DefaultLayout;