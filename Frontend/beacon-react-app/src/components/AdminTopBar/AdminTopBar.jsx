import s from "./AdminTopBar.module.css";
import { NavLink } from "react-router-dom";

export default function AdminTopBar() {
  return (
    <header className={s.topBar}>
      <NavLink to="/" className={s.leftSide}>
        <img src="/logo.svg" alt="Beacon logo" className={s.logo} />
        <h1 className={s.title}>B E A C O N</h1>
      </NavLink>

      <nav className={s.rightSide}>
        <ul className={s.navList}>
          <li className={s.navItem}>
          </li>
          <li className={s.navItem}>
            <img src="/profile_picture.png" alt="Profile" className={s.profileLogoTop} />
            <span className={s.accountText}>Admin</span>
          </li>
        </ul>
      </nav>
    </header>
  );
}
