import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme, role } = useTheme();
  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "var(--surface-2)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: "999px",
        padding: "0.35rem 0.6rem",
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
      <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>
        {role === "instructor" ? "Instructor" : "Student"} theme
      </span>
    </button>
  );
}