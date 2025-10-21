import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import s from "./StudentTopBar.module.css";
import ThemeToggle from "../../state/ThemeToggle";

export default function StudentTopBar() {
  // Ensure theme + role are applied whenever this shell mounts
  useEffect(() => {
    const html = document.documentElement;

    if (html.getAttribute("data-role") !== "student") {
      html.setAttribute("data-role", "student");
    }

    // theme: restore saved, else follow OS preference
    const saved = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = saved || (prefersDark ? "dark" : "light");
    if (html.getAttribute("data-theme") !== theme) {
      html.setAttribute("data-theme", theme);
    }
  }, []);

  return (
    <header className={s.topBar}>
      <NavLink to="/" className={s.leftSide}>
        <img src="/logo.svg" alt="Beacon logo" className={s.logo} />
        <h1 className={s.title}>B E A C O N</h1>
      </NavLink>

      <nav className={s.rightSide} aria-label="Student navigation">
        <ul className={s.navList}>
          <li className={s.navItem}>
            <NavLink
              to="/student/my-courses"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>My Courses</span>
              <span className={s.underline} />
            </NavLink>
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

          {/* Theme toggle persists choice via localStorage */}
          <li className={s.navItem}>
            <ThemeToggle />
          </li>

          <li className={s.navItem}>
            <img
              src="/profile_picture.png"
              alt="Profile"
              className={s.profileLogoTop}
            />
            <span className={s.accountText}>Student</span>
          </li>
        </ul>
      </nav>
    </header>
  );
}
