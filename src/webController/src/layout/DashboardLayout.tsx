import { type LayoutProps } from "./interface";

function DashboardLayout({ content }: LayoutProps) {
  return (
    <>
      <header>Dashboard Header</header>
      <main>{content}</main>
    </>
  );
}

export default DashboardLayout;
