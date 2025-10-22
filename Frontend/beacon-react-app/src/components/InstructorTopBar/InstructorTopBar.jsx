import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import s from "./InstructorTopBar.module.css";
import ThemeToggle from "../../state/ThemeToggle";

export default function InstructorTopBar() {
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize")) || 16
  );

  // Apply font size globally
  useEffect(() => {
    document.body.style.fontSize = `${fontSize}px`;
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
            <a href="/instructor/course-list" className={s.navLink}>
              Courses
            </a>
          </li>
          <li className={s.navItem}>
            <a href="/instructor/studentlist" className={s.navLink}>
              Students
            </a>
          </li>
          <li className={s.navItem}>
            <a href="/instructor/classrooms" className={s.navLink}>
              Classrooms
            </a>
          </li>
          <li className={s.navItem}>
           <a href="/instructor/student-progress" className={s.navLink}>
              Report
            </a>
          </li>
          <li className={s.navItem}>
            <ThemeToggle />
          </li>
          <li className={s.navItem}>
            <img
              src="/profile_picture.png"
              alt="Profile"
              className={s.profileLogoTop}
            />
            <span className={s.accountText}>Instructor</span>
          </li>
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
