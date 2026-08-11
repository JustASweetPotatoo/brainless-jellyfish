import { useState, type FormEvent } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

interface LoginLocationState {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Nếu user đã login
   * thì không cần ở login page.
   */
  if (isAuthenticated) {
    return (
      <button
        onClick={() =>
          navigate("/dashboard", {
            replace: true,
          })
        }
      >
        Go to Dashboard
      </button>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        username,
        password,
      });

      /**
       * URL trước khi login.
       */
      const state = location.state as LoginLocationState | null;

      const from = state?.from?.pathname ?? "/dashboard";

      const search = state?.from?.search ?? "";

      const hash = state?.from?.hash ?? "";

      navigate(`${from}${search}${hash}`, {
        replace: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 350,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h1>Login</h1>

        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          autoComplete="username"
          disabled={isSubmitting}
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        {error && (
          <div
            style={{
              color: "red",
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div>
          <strong>Demo account</strong>

          <div>Username: admin</div>

          <div>Password: 123456</div>
        </div>
      </form>
    </div>
  );
}
