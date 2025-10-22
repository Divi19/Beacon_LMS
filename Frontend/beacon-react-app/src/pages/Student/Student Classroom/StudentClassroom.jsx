import React, { useEffect, useMemo, useState } from "react";
import s from "./StudentClassroom.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api"; 

// helper: stable order Mon → Sun
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const dayRank = (d) => DAY_ORDER.indexOf(d ?? "") ?? 99;

const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(-2)}`;
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function StudentClassroom() {
  const [now, setNow] = useState(new Date());
  const [classrooms, setClassrooms] = useState([]);

  async function fetchClassrooms(){
    try {
        const res = await api.get("/student/classrooms/viewing/")
        setClassrooms(res.data)
    } catch (err) {
        const detail = err?.response?.data?.detail;
        console.error("Error:", detail);
        alert(detail || "An error occured. Please try again.");
    }}

  // tick the live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ---- Dummy values for UI 
  useEffect(() => {
    // When backend is ready, replace:
    // const { data } = await api.get("/student/classrooms/"); // aggregated
    // setClassrooms(data.results ?? data);
    fetchClassrooms()
    ;
  }, []);

  // sort by day, then start time
  const sorted = useMemo(() => {
    const toMinutes = (hhmm) => {
      if (!hhmm) return 24 * 60 + 1;
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };
    return [...classrooms].sort((a, b) => {
      const d = dayRank(a.day_of_week) - dayRank(b.day_of_week);
      if (d !== 0) return d;
      return toMinutes(a.time_start) - toMinutes(b.time_start);
    });
  }, [classrooms]);

  const niceHours = (mins) => {
    if (!mins) return "—";
    const h = Math.round(mins / 60);
    return `${h} ${h === 1 ? "Hour" : "Hours"}`;
  };

  return (
    <div className={s.page}>
      <StudentTopBar />
      <div className={s.shell}>
        <h1 className={s.title}>MY CLASSROOMS</h1>

        {/* clock strip */}
        <div className={s.clockStrip}>
          <div className={s.clockLabel}>Current Day and Time:</div>
          <div className={s.pill}>{now.toLocaleDateString(undefined, { weekday: "long" })}</div>
          <div className={s.pill}>{fmtTime(now)}</div>
          <div className={s.pill}>{fmtDate(now)}</div>
        </div>

        {/* list */}
        {sorted.map((c) => {
          const availability = `${Math.max(c.capacity - (c.enrolled_count ?? 0), 0)}/${c.capacity ?? "—"}`;
          return (
            <div key={c.classroom_id} className={s.card}>
              <div className={s.headerRow}>
                <span className={s.day}>{c.day_of_week}</span>
                <span className={s.time}>
                  {c.time_start} – {c.time_end}
                </span>
              </div>

              <div className={s.metaRow}>
                <span>{niceHours(c.duration_minutes)}</span>
                <span>{(c.enrolled_count ?? 0)} students</span>
                <span>Availability: {availability}</span>
                <span>ID: {c.classroom_id}</span>
                <span>Type: {c.is_online ? "Online" : "Physical"}</span>
              </div>

              <div className={s.bodyRow}>
                <div className={s.lines}>
                  <div className={s.line}>
                    <span className={s.label}>Course:</span>{" "}
                    <span className={s.linkish}>
                      {c.course_id}  {c.course_title}
                    </span>
                  </div>
                  <div className={s.line}>
                    <span className={s.label}>Lesson:</span>{" "}
                    <span className={s.linkish}>
                      {c.lesson_id}  {c.lesson_title}
                    </span>
                  </div>
                </div>
                <div className={s.rightCol}>
                  <div className={s.weeks}>Duration weeks: {c.duration_weeks ?? "—"}</div>
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className={s.empty}>You have no classrooms yet.</div>
        )}
      </div>
    </div>
  );
}
