import { ColorModeContext, useMode } from "./theme";

import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./routes/Dashboard";
import Overview from "./components/Overview";
import LoginPage from "./routes/Login";

import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  const { colorMode } = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Overview />} />
            {/* /dashboard/team */}
            <Route path="team" element={<div>Team</div>} />
            {/* /dashboard/contacts */}
            <Route path="contacts" element={<div>Contacts</div>} />
            {/* /dashboard/invoices */}
            <Route path="invoices" element={<div>Invoices</div>} />
            {/* /dashboard/form */}
            <Route path="form" element={<div>Form</div>} />
            {/* /dashboard/bar */}
            <Route path="bar" element={<div>Bar Chart</div>} />
            {/* /dashboard/pie */}
            <Route path="pie" element={<div>Pie Chart</div>} />
            {/* /dashboard/line */}
            <Route path="line" element={<div>Line Chart</div>} />
            {/* /dashboard/faq */}
            <Route path="faq" element={<div>FAQ</div>} />
            {/* /dashboard/calendar */}
            <Route path="calendar" element={<div>Calendar</div>} />
            {/* /dashboard/geography */}
            <Route path="geography" element={<div>Geography</div>} />
          </Route>
        </Route>
      </Routes>
    </ColorModeContext.Provider>
  );
}

export default App;
