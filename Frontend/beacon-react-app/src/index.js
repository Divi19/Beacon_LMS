// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { EnrollmentProvider } from "./state/EnrollmentContext";
import { ThemeProvider } from "./state/ThemeContext";

/**
 * Ensure role + theme are set on <html> before the app renders.
 */
(function () {
  const html = document.documentElement;

  // Role: restore or default to "student" (lowercased to match CSS selectors)
  const role = (
    window.__USER_ROLE__ ||
    localStorage.getItem("role") ||
    "student"
  ).toLowerCase();
  html.setAttribute("data-role", role);

  // Theme: restore saved; else follow OS preference
  const saved = localStorage.getItem("theme"); // "light" | "dark" | null
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme =
    saved === "dark" || saved === "light"
      ? saved
      : prefersDark
      ? "dark"
      : "light";
  html.setAttribute("data-theme", theme);
})();

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <EnrollmentProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </EnrollmentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
