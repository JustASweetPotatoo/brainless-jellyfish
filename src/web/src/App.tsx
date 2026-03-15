import { Routes, useLocation } from "react-router-dom";
import { routerRender } from "./routes/RouterRender";
import "./lang/i18n";

function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      {/* Main routes */}
      <Routes location={state?.backgroundLocation || location}>
        {routerRender.renderRoutes()}
      </Routes>
    </>
  );
}

export default App;
