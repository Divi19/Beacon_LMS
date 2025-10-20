import s from "./InstructorTopBar.module.css";
import { NavLink } from "react-router-dom";

export default function InstructorTopBar() {
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
          <li className={s.navItem}> <a href="/instructor/student-progress" className={s.navLink}>Student Progress</a></li>
          <li className={s.navItem}>
            {" "}
            <a href="/instructor/classrooms" className={s.navLink}>
              Classrooms
            </a>
          </li>
          <li className={s.navItem}>Reports</li>
          <li className={s.navItem}>
            <img
              src="/profile_picture.png"
              alt="Profile"
              className={s.profileLogoTop}
            />
            <span className={s.accountText}>Instructor</span>
          </li>
        </ul>
      </nav>
    </header>
  );
}
