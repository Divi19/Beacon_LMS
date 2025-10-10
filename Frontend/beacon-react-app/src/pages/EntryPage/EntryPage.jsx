// src/pages/EntryPage.jsx
import { useState } from "react";
import Button from "../../components/Button/Button";
import s from "./EntryPage.module.css";
import { useNavigate } from "react-router-dom";

export default function EntryPage() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  const go = (r) => {
    const next =
      r === "student" ? "/trial" : r === "instructor" ? "/instructor/login" : "/admin/log-in";
    navigate(next);
  };

  return (
    <div className={s.shell}>
      {/* LEFT PANEL */}
      <section className={s.left}>
        <div className={s.logoWrap}>
          <div className={s.logoCircle}>
            <img src="/logo.svg" alt="Beacon Logo" className={s.logoImg} />
          </div>
          <div className={s.slogan}>“Brillare Luminoso”</div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className={s.right}>
        <div className={s.card}>
          <h1 className={s.title}>Choose</h1>
          <div className={s.buttons}>
            <Button
              variant="teal"
              className={s.entryBtn}
              onClick={() => go("student")}
            >
              Student
            </Button>
            <Button
              variant="orange"
              className={s.entryBtn}
              onClick={() => go("instructor")}
            >
              Instructor
            </Button>
            <Button
              variant="green"
              className={s.entryBtn}
              onClick={() => go("admin")}
            >
              Admin
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
