import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import { TeamProvider } from "./context/TeamContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import App from "./App.jsx";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <TeamProvider>
                <NotificationProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </NotificationProvider>
              </TeamProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);
