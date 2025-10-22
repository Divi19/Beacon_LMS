import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../../api";
import i from "./InstructorClassrooms.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";

export default function InstructorClassrooms() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedClassroomId = location.state?.selectedClassroomId || null;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get("/instructor/classrooms/own/");
        if (!ignore) {
          const classrooms = Array.isArray(data) 
            ? data
            : [];
          setItems(classrooms);
        }
      } catch (e) {
        console.error("Failed to fetch classrooms", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return <div className={i.container}><h1 className={i.title}>CLASSROOM</h1><p>Loading…</p></div>;
  }

  return (
    <div className={i.wrap}>
        <InstructorTopBar />
    <div className={i.container}>
      <h1 className={i.title}>CLASSROOM</h1>

      <div className={i.actions}>
        <button className={i.createBtn} onClick={() => navigate("/instructor/classrooms/create")}>
          Create Classroom <span className={i.plus}>+</span>
        </button>
      </div>

      <div className={i.grid}>
        {items.map((c) => (
          <div key={c.classroom_id} className={`${i.card} ${c.classroom_id === selectedClassroomId ? i.selected : ""}`}>
            {/*<div className={i.icon} aria-hidden>Class</div>*/}
            <h4 className={i.courseName}>
              {c.location ? c.location : "Unlinked"}
            </h4>
            <h3 className={i.roomLabel}> Classroom {c.classroom_id}</h3>
            <p className={i.meta}>
              Supervisor: {c.supervisor || "Unlinked"}
            </p>
            <p className={i.meta}>
              Lesson linked: {c.lesson_id || "Unlinked"}
            </p>
            <p className={i.meta}>
              Capacity: {c.capacity || "Unlinked"}
            </p>
            <p className={i.meta}>
              Type: {c.is_online ? "-" : "Physical"}
            </p>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
