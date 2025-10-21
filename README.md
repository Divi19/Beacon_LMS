Course Progress - Singular Object
- Get a course with course_id which is a field of the object
- Get total lessons available = tot_lessons --> annotate as "tot_lessons" 
- Get all enrolled students using enrolled model = tot_students --> annotate as "enrolled_count"
- Sum of all complete lessonenrollment related to that lesson = sum_completed -> annotate as "sum_completed"
- Average of completed lessonenrollment : avg_completed = sum_completed / tot_students  --> annotate as : avg_completed 
-  Average of course progress: avg_progress = avg_completed / tot_lessons --> annotate as "avg_progress"
-- avg_progress * 100 --> annotate as avg_percentages
-- Add another field "lessons" containing a list of lesson objects where:  

Lesson Objects - All objects related to a lesson 
- Get all related lessons using "course_id" (Must be that the course) 
- If self as course director, show all lessons; if not, show only lessons with self as designer 
- annotate:
- "tot_lesson_stud" --> total number of students enrolled using lessonenrollment model
- "tot_done" --> total number of studentassignmentprogress related to lessonassignment which is related to lesson and studentreadingprogress related to lessonassignment which is related to lesson that has field is_completed or completed as True 
- "avg_done" --> tot_done / tot_lesson_stud (average of assignments/readings done by each student)
- "tot_asgns_readings" --> total number of lessonassignment and lessonreadings related to this lesson using lesson_id 
- "lesson_progress_percentage" --> (avg_done/tot_asgns_readings) * 100 
- "lesson_progress"  --> (avg_done/tot_asgns_readings) 

- Another field containing a list of student objects "students" where:
Students: All related objects
- Got using "course_id" and related to the course by enrollment model 
- Each student annotated with:
- "lessons_completed" --> sum of lessonenrollment with field is_completed or completed as True which is related to the course by the lesson model. 
- "credits_earned" --> sum of credits of lessons related to the lessonenrollment by lessons that has fields is_completed or completed as True which is related to the course by the lesson model. 
-- "avg_course_progress" --> lessons_completed / tot_lessons, where tot_lessons is previously annotated



Lesson Progress - Singular Object
Lesson Objects - All objects related to a lesson 
- Get object using lesson_id 
- "tot_lesson_stud" --> total number of students enrolled using lessonenrollment model
- "tot_done" --> total number of studentassignmentprogress related to lessonassignment which is related to lesson and studentreadingprogress related to lessonassignment which is related to lesson that has field is_completed or completed as True 
- "avg_done" --> tot_done / tot_lesson_stud (average of assignments/readings done by each student)
- "tot_asgns_readings" --> total number of lessonassignment and lessonreadings related to this lesson using lesson_id 
- "lesson_progress_percentage" --> (avg_done/tot_asgns_readings) * 100 
- "lesson_progress"  --> (avg_done/tot_asgns_readings) 

Add a new field "students" 
- Get the students enrolled in this lesson related by lessonenrollment model 
- Students have accessible attributes: last_name, first_name, title
- Annotate field "email" from relation user__email 
- Annotate field "enrolled_at" from relation lessonclassroom__enrolled_at
- Annotate field "session" with attributes:
-   "location" from classroom using relation classroomenrollment__lessonclassroom__classroom__location 
    "day_of_week" from classroom using relation classroomenrollment__lessonclassroom__day_of_week 
    "time_start" using classroomenrollment__lessonclassroom__time_start
    "time_end" using classroomenrollment__lessonclassroom__time_end
- Annotate field:
    "asgn_completed" that is the sum of StudentAssignmentProgress related to the lesson that has field is_completed or completed as True
    "reading_completed" that is the sum of StudentReadingProgress related to the lesson that has field is_completed or completed as True
    "tot_completed" = asgn_completed + reading_completed 
- Annotate field: 
    "tot_asngs" = sum of all lessonassignments related to the lesson 
    "tot_readings" = sum of all lessonreadings related to the lesson 
    "lesson_progress" =( tot_asngs + tot_readings) / tot_asgns_readings where tot_asgns_readings has been previously annotated




Student Singular Object - Showing related courses only 
- Student gotten by student_profile_id given 
Student details shown (
    "title"
    "last_name"
    "first_name"
    "email" accessible by user__email 
    "student_profile_id"
    "student_no"
    "locked_at" 
    )

depending on course_id given 
 
if course_id not given in params
- "courses" frontend accessible field that show a list of courses object that are related to the students by 
-   enrollment models with annotated fields:
        "title" related by enrollment__course__title
        "credits related by enrollment__course__credits 
        "course_id" related by enrollment__course__course_id
        "enrolled_at" related by enrollment__enrolled_at 
        "enrolled_count"which is the sum of distinct enrollment objects related to the course
        "lessons_done" a sum of lessonenrollment models related to the enrollment by enrollment__course__lesson__lessonenrollment that has status "Completed" 
        "tot_lessons" a sum of lessons with course attribute related to the enrollment__course 
        "progress" = lessons_done/tot_lessons 
        "progress_percentages" = progress * 100 

if course_id given in params 
"course_id" field showing course_id 
"title" field showing title of course with the course_id 
"enrolled_count" showing the sum of enrollment objects related to the course 
"lessons" contain list of lesson objects annotated with:
    "enrolled_at" related by lesson__lessonenrollment of the student 
    
    "tot_readings" sum of lessonreadings related to the lesson
    "tot_asgns" sum of lessonassignments related to the lesson 
    "asgn_completed" sum of studentassignmentprogress related to the lesson with is_completed as True
    "reading_completed"sum of studentreadingprogress related to the lesson with is_completed as True
    
    "day_of_week" related by lesson__lessonclassroom__day_of_week where lessonclassroom__student is the student 
    "time_start" related by lesson__lessonclassroom__time_start where lessonclassroom__student is the student 
    "time_end" related by lesson__lessonclassroom__time_end where lessonclassroom__student is the student
    "location" related by lesson__lessonclassroom__classroom__location where lessonclassroom__student is the student  
    
    "progress" =( asgn_completed + reading_completed ) / (tot_readings + tot_asgns)
    "progress_percentages" = progress * 100  



    
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
