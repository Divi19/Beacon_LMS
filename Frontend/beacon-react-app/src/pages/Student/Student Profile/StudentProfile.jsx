import React, { useEffect, useState } from "react";
import s from "./StudentProfile.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";
// --- TEMP: dummy values just for frontend (replace with real fetch when ready) ---

export default function StudentProfile() {
  const [student, setStudent] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    // TODO: replace this with a real request (e.g., api.get("/user/") or /student/me)
    try {
    api.get(`/student/profile/`).then(
      res =>  setStudent(res.data)
    )} catch (err) {
      console.log("Error displaying profile")
      alert("Error displaying profile")
    }
   
  }, []);

  return (
    <div className={s.page}>
      <StudentTopBar />
      <h1 className={s.title}>STUDENT PROFILE</h1>

      <div className={s.card}>
        <img
          src="/profile_picture.png"
          alt="Profile"
          className={s.profileLogoTop}
        />

        <div className={s.info}>
          <div className={s.row}>
            <span className={s.label}>Student First Name:</span>
            <span className={s.value}>{student.first_name || "—"}</span>
          </div>

          <div className={s.row}>
            <span className={s.label}>Student Last Name:</span>
            <span className={s.value}>{student.last_name || "—"}</span>
          </div>

          <div className={s.row}>
            <span className={s.label}>Student Email:</span>
            <span className={s.value}>{student.email_output || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
