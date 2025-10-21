import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light"); // plain string state

  // Read the current theme from <html data-theme="...">
  useEffect(() => {
    const html = document.documentElement;
    const attr = html.getAttribute("data-theme");
    const current = attr === "dark" ? "dark" : "light"; // normalize
    setTheme(current);
  }, []);

  // Apply + persist whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (_) {
      /* ignore storage errors (private mode, etc.) */
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      style={{
        background: "var(--surface-2)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: "999px",
        padding: "0.35rem 0.6rem",
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "🌙" : "☀️"}
      <span className="themeToggleLabel" style={{ fontSize: "0.8rem", opacity: 0.9 }}>
        Switch theme
      </span>
    </button>
  );
}
