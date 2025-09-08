import s from "./InstructorTopBar.module.css";

export default function InstructorTopBar() {
  return (
    <header className={s.topBar}>
      {/* LEFT SIDE - Logo + Title */}
      <div className={s.leftSide}>
        <img
          src="/logo.svg" 
          alt="Logo"
          className={s.logo}
        />
        <h1 className={s.title}>B E A C O N</h1>
      </div>

      {/* RIGHT SIDE - Navigation */}
      <nav className={s.rightSide}>
        <ul className={s.navList}>
          <li className={s.navItem}>
            <a href="/instructor/course-list" className={s.navLink}>Courses</a></li>
          <li className={s.navItem}>Student Progress</li>
          <li className={s.navItem}>Classrooms</li>
          <li className={s.navItem}>Reports</li>
          <li className={s.navItem}>
            <img
              src="/profile_picture.png"  // replace with your profile image path
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
