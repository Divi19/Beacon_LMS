import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background: "var(--surface-2)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: "999px",
        padding: "0.35rem 0.6rem",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "🌙" : "☀️"}
      <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>Switch theme</span>
    </button>
  );
}
