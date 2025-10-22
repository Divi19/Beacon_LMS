import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const location = useLocation();

  // Persisted theme
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  // Role inferred from path + persisted (so a refresh on /instructor/* stays instructor)
  const [role, setRole] = useState(() => localStorage.getItem("role") || "student");

  // Keep role in sync with URL automatically
  useEffect(() => {
    const inferred = location.pathname.startsWith("/instructor") ? "instructor" : "student";
    if (inferred !== role) setRole(inferred);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply both to <html> and persist
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-role", role);
    localStorage.setItem("theme", theme);
    localStorage.setItem("role", role);
  }, [theme, role]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, role, setRole }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}