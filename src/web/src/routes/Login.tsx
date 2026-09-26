import { useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const queryError = new URLSearchParams(location.search).get("error");
  const error =
    queryError === "oauth_not_configured"
      ? "Discord OAuth chưa được cấu hình trên máy chủ."
      : queryError
        ? "Đăng nhập Discord thất bại. Vui lòng thử lại."
        : "";
  const returnTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#11121a] px-5 py-10 font-['DM_Sans'] text-[#f4f3fb]">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-[#7657e720] blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[#4b3c8c20] blur-3xl" />
      <section className="relative w-full max-w-97.5 rounded-2xl border border-[#302e3e] bg-[#1b1a27] p-7 shadow-[0_20px_60px_#00000055]">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[12px_12px_12px_4px] bg-[linear-gradient(135deg,#957bff,#6247d8)] font-['Plus_Jakarta_Sans'] text-[21px] font-extrabold text-white">
            S
          </div>
          <div>
            <strong className="block font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-white">
              Suwa
            </strong>
            <span className="block text-[8px] font-bold tracking-[1.2px] text-[#828397]">
              BOT DASHBOARD
            </span>
          </div>
        </div>
        <div className="mb-7 mt-9">
          <h1 className="m-0 font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">
            Kết nối Discord
          </h1>
          <p className="m-0 mt-2 text-xs text-[#858798]">
            Đăng nhập bằng tài khoản Discord để quản lý server của bạn.
          </p>
        </div>
        {error && (
          <p
            className="mb-4 rounded-lg border border-[#a94c5a] bg-[#63293855] p-2.5 text-[10px] text-[#ff9eac]"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#5865f2] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#4752c4] disabled:cursor-wait disabled:opacity-60"
          disabled={submitting}
          onClick={() => {
            setSubmitting(true);
            login(returnTo);
          }}
        >
          <span className="grid h-5 w-5 place-items-center rounded-md bg-white/15 font-bold">
            D
          </span>
          {submitting ? "Đang chuyển tới Discord..." : "Đăng nhập với Discord"}
        </button>
        <p className="m-0 mt-5 text-center text-[10px] text-[#77798a]">
          Suwa không lưu mật khẩu Discord của bạn.
        </p>
      </section>
    </main>
  );
}
