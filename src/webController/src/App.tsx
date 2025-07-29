import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./routes/Dashboard";
import DashboardLayout from "./layout/DashboardLayout";
import DefaultLayout from "./layout/DefaultLayout";

export const LayoutMap = {
  dashboard: DashboardLayout,
  default: DefaultLayout,
} as const;

export type LayoutKey = keyof typeof LayoutMap;

function App() {
  const routeList = [Dashboard];  

  const renderRoutes = () => {
    routeList.map((route) => {
      const layout = LayoutMap[route.layout];
      const element = route.component;
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/login"></Route>
        <Route path="/dashboard" element={<Dashboard></Dashboard>}></Route>
        <Route path="/*"></Route>
      </Routes>
    </Router>
  );
}

export default App;
