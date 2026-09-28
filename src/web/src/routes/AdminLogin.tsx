import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { requestAdminLoginToken, verifyAdminLoginToken } from "../auth/authAPI";

export default function AdminLogin() {
  const { refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [tokenSent, setTokenSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const returnTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/admin/status";

  async function handleRequestToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await requestAdminLoginToken(email.trim());
      setTokenSent(true);
      setMessage("Nếu Gmail này được cấp quyền quản trị, mã đăng nhập sẽ được gửi đến hộp thư.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không gửi được mã đăng nhập.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await verifyAdminLoginToken(email.trim(), token.trim());
      await refresh();
      navigate(returnTo, { replace: true });
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Mã đăng nhập không hợp lệ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#11121a] px-5 py-10 font-['DM_Sans'] text-[#f4f3fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,#315d5040,transparent_68%)]" />
      <section className="relative w-full max-w-102.5 rounded-xl border border-[#343642] bg-[#1b1d25] p-7 shadow-[0_20px_60px_#00000055]">
        <Link
          className="text-xs font-semibold text-[#9fd9c0] no-underline hover:text-white"
          to="/login"
        >
          ← Đăng nhập Discord
        </Link>
        <div className="mb-7 mt-8">
          <p className="m-0 text-[10px] font-bold tracking-[1.4px] text-[#9fd9c0]">SUWA ADMIN</p>
          <h1 className="m-0 mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">
            Đăng nhập quản trị
          </h1>
          <p className="m-0 mt-2 text-xs leading-relaxed text-[#a3a5b1]">
            Nhận mã dùng một lần qua Gmail đã được cấp quyền quản trị.
          </p>
        </div>

        {error && (
          <p
            className="mb-4 rounded-lg border border-[#a94c5a] bg-[#63293855] p-3 text-xs text-[#ffb0b9]"
            role="alert"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="mb-4 rounded-lg border border-[#426c5a] bg-[#244a3b55] p-3 text-xs text-[#a9e4c7]"
            role="status"
          >
            {message}
          </p>
        )}

        <form className="space-y-4" onSubmit={tokenSent ? handleVerifyToken : handleRequestToken}>
          <label className="block text-xs font-semibold text-[#d7d8e0]" htmlFor="admin-email">
            Gmail quản trị
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-[#3d404b] bg-[#14161d] px-3 py-3 text-sm text-white outline-none transition focus:border-[#75b998]"
              disabled={tokenSent || submitting}
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@gmail.com"
              required
              type="email"
              value={email}
            />
          </label>

          {tokenSent && (
            <label className="block text-xs font-semibold text-[#d7d8e0]" htmlFor="admin-token">
              Mã đăng nhập
              <input
                autoComplete="one-time-code"
                className="mt-2 w-full rounded-lg border border-[#3d404b] bg-[#14161d] px-3 py-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none transition focus:border-[#75b998]"
                inputMode="numeric"
                id="admin-token"
                maxLength={6}
                onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))}
                pattern="[0-9]{6}"
                placeholder="000000"
                required
                value={token}
              />
            </label>
          )}

          <button
            className="w-full rounded-lg bg-[#34765a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3d8968] disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Đang xử lý..."
              : tokenSent
                ? "Xác nhận mã đăng nhập"
                : "Gửi mã đến Gmail"}
          </button>
        </form>

        {tokenSent && (
          <button
            className="mt-3 w-full text-xs font-semibold text-[#9fd9c0] hover:text-white disabled:opacity-60"
            disabled={submitting}
            onClick={() => {
              setTokenSent(false);
              setToken("");
              setMessage("");
              setError("");
            }}
            type="button"
          >
            Dùng Gmail khác
          </button>
        )}

        <p className="m-0 mt-5 text-center text-[10px] leading-relaxed text-[#777b88]">
          Mã có hiệu lực trong 10 phút. Chỉ Gmail được cấu hình ở máy chủ mới có thể đăng nhập.
        </p>
      </section>
    </main>
  );
}
