import type { Layout, LayoutData } from "../common/interface";

const Header = () => {
  return <header></header>;
};

const Footer = () => {
  return <footer></footer>;
};

export const DefaultLayout = (_data: LayoutData): Layout => {
  return { Header: Header, Footer: Footer, data: {} };
};
