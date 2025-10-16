import { NavLink } from "react-router-dom";
import s from "./StudentTopBar.module.css";

export default function StudentTopBar() {
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
              to="/student/progress"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>Student Progress</span>
              <span className={s.underline} />
            </NavLink>
          </li>

          <li className={s.navItem}>
            <NavLink
              to="/student/progress"
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
              to="/student/enrollment"
              className={({ isActive }) =>
                [s.navLink, isActive ? s.active : ""].join(" ")
              }
            >
              <span>Report</span>
              <span className={s.underline} />
            </NavLink>
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
