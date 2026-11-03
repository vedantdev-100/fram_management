import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { initializeTheme } from "./stores/theme";
const disposeTheme = initializeTheme();
if (import.meta.hot) import.meta.hot.dispose(disposeTheme);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
