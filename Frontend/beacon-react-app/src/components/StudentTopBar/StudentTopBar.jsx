import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import s from "./StudentTopBar.module.css";
import ThemeToggle from "../../state/ThemeToggle";

export default function StudentTopBar() {
  // State for font size slider
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize")) || 16
  );

  // Apply role & theme on mount
  useEffect(() => {
    const html = document.documentElement;

    if (html.getAttribute("data-role") !== "student") {
      html.setAttribute("data-role", "student");
    }

    const saved = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = saved || (prefersDark ? "dark" : "light");
    if (html.getAttribute("data-theme") !== theme) {
      html.setAttribute("data-theme", theme);
    }
  }, []);

  // Apply font size whenever it changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  return (
    <header className={s.topBar}>
      <NavLink to="/" className={s.leftSide}>
        <img src="/logo.svg" alt="Beacon logo" className={s.logo} />
        <h1 className={s.title}>B E A C O N</h1>
      </NavLink>

      <nav className={s.rightSide}>
        <ul className={s.navList}>
          <li className={s.navItem}>
            <a href="/student/my-courses" className={s.navLink}>
              Courses
            </a>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/student/profile"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>Student Profile</span>
              <span className={s.underline} />
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/student/classroom"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>Classroom</span>
              <span className={s.underline} />
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/student/reports"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>Report</span>
              <span className={s.underline} />
            </NavLink>
          </li>

          {/* Theme toggle */}
          <li className={s.navItem}>
            <ThemeToggle />
          </li>

          {/* Profile */}
          <li className={s.navItem}>
            <img
              src="/profile_picture.png"
              alt="Profile"
              className={s.profileLogoTop}
            />
            <span className={s.accountText}>Student</span>
          </li>

          {/* Font size slider */}
          <li className={`${s.navItem} ${s.sliderContainer}`}>
            <label htmlFor="fontSizeSlider" className={s.sliderLabel}>
              A
            </label>
            <input
              id="fontSizeSlider"
              type="range"
              min="14"
              max="20"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className={s.slider}
            />
            <label htmlFor="fontSizeSlider" className={s.sliderLabelLarge}>
              A
            </label>
          </li>
        </ul>
      </nav>
    </header>
  );
}
