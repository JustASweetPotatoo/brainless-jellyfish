import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import BotStatus from "./routes/BotStatus";
import Dashboard from "./routes/Dashboard";
import Home from "./routes/Home";
import AdminLogin from "./routes/AdminLogin";
import LoginPage from "./routes/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin/status" element={<BotStatus />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
