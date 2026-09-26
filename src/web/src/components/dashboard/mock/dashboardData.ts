import type { DashboardPage } from "../core/types.ts";

export const pageCopy: Record<DashboardPage, { title: string; subtitle: string; nav: string }> = {
  overview: {
    title: "Tổng quan",
    subtitle: "Theo dõi sức khoẻ bot và hoạt động của máy chủ.",
    nav: "Tổng quan",
  },
  modules: {
    title: "Quản lý module",
    subtitle: "Bật hoặc tắt các tính năng của bot cho máy chủ này.",
    nav: "Quản lý module",
  },
  statistics: {
    title: "Thống kê máy chủ",
    subtitle: "Nhìn lại mức tăng trưởng và mức độ tương tác của cộng đồng.",
    nav: "Thống kê",
  },
  settings: {
    title: "Cài đặt máy chủ",
    subtitle: "Thiết lập các tuỳ chọn cơ bản cho bot và kênh thông báo.",
    nav: "Cài đặt",
  },
  "audit-log": {
    title: "Nhật ký chỉnh sửa",
    subtitle: "Xem lịch sử các thay đổi cấu hình và thiết lập trong máy chủ.",
    nav: "Nhật ký chỉnh sửa",
  },
};

export const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");
export const sidebarMotion = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const servers = [
  {
    id: "thien-ha",
    name: "Thiên Hà Của Sữa",
    members: "8,429 thành viên",
    initials: "TH",
    color: "#5c3ac4",
  },
  {
    id: "moonlight",
    name: "Moonlight Community",
    members: "3,182 thành viên",
    initials: "MC",
    color: "#247d91",
  },
  {
    id: "pixel-house",
    name: "Pixel House",
    members: "1,906 thành viên",
    initials: "PH",
    color: "#b05a3c",
  },
  {
    id: "dev-lounge",
    name: "Dev Lounge",
    members: "764 thành viên",
    initials: "DL",
    color: "#3b7f5f",
  },
] as const;
