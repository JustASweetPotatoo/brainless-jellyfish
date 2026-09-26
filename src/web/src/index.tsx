import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { UserProvider } from "./auth/UserContext";
import { PushNotificationProvider } from "./components/PushNotificationProvider";
import { ThemeProvider } from "./theme";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <ThemeProvider>
          <PushNotificationProvider>
            <App />
          </PushNotificationProvider>
        </ThemeProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
