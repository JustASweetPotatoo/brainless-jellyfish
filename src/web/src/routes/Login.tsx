import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ username, password });
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch {
      setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow glow-one" />
      <div className="login-glow glow-two" />
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Suwa</strong>
            <span>BOT DASHBOARD</span>
          </div>
        </div>
        <div className="login-title">
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập để quản lý Discord server của bạn.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Tên đăng nhập
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="primary-button login-button" disabled={submitting}>
            {submitting ? "Đang đăng nhập..." : "Đăng nhập vào dashboard"}
          </button>
        </form>
        <p className="demo-login">
          Tài khoản demo: <b>admin</b> · <b>123456</b>
        </p>
      </section>
    </main>
  );
}
