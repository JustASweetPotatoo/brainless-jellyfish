// import type { ComponentType } from "react";
// // import DashboardSidebarComponent from "../remove/components/sidebar/dashboard/DashboardSidebarComponent";
// import HomePage from "../pages/Home";
// export interface RouteConfig {
//   path: string;
//   page: ComponentType;
//   layout?: "default" | "edit" | "main" | "dashboard" | "none";
//   children?: RouteConfig[];
// }

// export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <div className="flex flex-row bg-[#E5E7EB] relative min-h-svh">
//       {/* <DashboardSidebarComponent /> */}
//       <div className="flex-1 p-4">{children}</div>
//     </div>
//   );
// };

// export const routes: RouteConfig[] = [
//   { path: "*", page: HomePage, layout: "default" },
//   // { path: "/exam", page: ExamEditorPage, layout: "edit" },
//   // { path: "/upload", page: CreateExamPage, layout: "main" },
//   // {
//   //   path: "/dashboard",
//   //   page: DashboardPage,
//   //   layout: "dashboard",
//   //   children: [
//   //     { path: "", page: () => <DashboardComponent name="" avatar="" /> },
//   //     {
//   //       path: "upgrade",
//   //       page: () => (
//   //         <div className="p-4">
//   //           <PricingComponent />
//   //         </div>
//   //       ),
//   //     },
//   //   ],
//   // },
//   // { path: "/signin", page: SigninPage, layout: "none" },
//   // { path: "/signup", page: SignUpPage, layout: "none" },
//   // { path: "*", page: NotFoundPage, layout: "none" },
// ];
