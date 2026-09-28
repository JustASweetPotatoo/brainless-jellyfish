import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export default function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const location = useLocation();

  /**
   * AuthContext đang restore session.
   *
   * Không được redirect trong thời gian này.
   */
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  /**
   * Chưa login.
   */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (adminOnly && !user?.id.startsWith("admin:")) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  /**
   * Đã login.
   */
  return <Outlet />;
}
