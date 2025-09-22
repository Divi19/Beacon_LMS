import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorClassCreation.module.css";
import {api} from "../../../api" 

export default function InstructorClassroomCreate() {
  /**
   * Classroom creation. Requires POST method from view. 
   */
  const navigate = useNavigate();

  /**
   * Backend using dummy value. TODO: Change after US2 ready 
   */
  const { courseId, lessonId } = useParams();
  const [form, setForm] = useState({
    day: "", //day_of_week
    start_time: "", //time_start
    end_time: "", //time_end
    capacity: "", //capacity 
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // duration in minutes based on time inputs
  const durationMinutes = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const d = end - start;
    return d > 0 ? d : 0;
  }, [form.start_time, form.end_time]);

  const durationLabel = useMemo(() => {
    if (!durationMinutes) return "Duration (calculated from time)";
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }, [durationMinutes]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Backend handling submission 
   * @param {*} e 
   * @returns 
   */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // simple client validation
    if (
      !form.day ||
      !form.start_time ||
      !form.end_time ||
      !form.capacity
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (durationMinutes <= 0) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {

      // Replace with your real API call:
      // POST /api/courses/:courseId/lessons/:lessonId/classrooms/
      // body: { classroom_id, day, start_time, end_time, duration_minutes, capacity }
      //await new Promise((r) => setTimeout(r, 600)); // simulate latency

      // Build the classroom record to save (shape matches LessonDetail renderer)
      // local storage for frontend simulation to be replaced by backend. until setshowsuccess.
      const newClassroom = {
        //id: form.classroom_id || Math.random().toString().slice(2, 8),
        day: form.day,
        start_time: form.start_time,
        end_time: form.end_time,
        duration_minutes: Number(durationMinutes),
        capacity: Number(form.capacity),
      };
      console.log("payload", newClassroom);
      await api.post(`/instructor/${lessonId}/classrooms/`, newClassroom);
      // Show successfull creation popup
      setShowSuccess(true);
    } catch (err) {
      const apiMsg =
            err?.response?.data?.detail ||
            (Array.isArray(err?.response?.data?.non_field_errors) && err.response.data.non_field_errors[0]) ||
            Object.entries(err?.response?.data || {})
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join(", ");
          setError(apiMsg || "Failed to create classroom. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <InstructorTopBar />
      <main className={s.wrap}>
        <section className={s.page}>
          <h1 className={s.pageTitle}>CLASSROOM CREATION</h1>

          <section className={`${s.cardBase} ${s.formCard}`}>
            <h2 className={s.formTitle}>Classroom Details</h2>

            <form className={s.form} onSubmit={handleSubmit} noValidate>
              <div className={s.row}>
                <label htmlFor="classroom_id" className={s.label}>
                  Classroom ID:
                </label>
                <input
                  id="classroom_id"
                  name="classroom_id"
                  type="text"
                  className={s.input}
                  placeholder="Classroom ID"
                  value={form.classroom_id}
                  onChange={onChange}
                  required
                />
              </div>

              <div className={s.row}>
                <span className={s.label}>Classroom Duration:</span>
                <input
                  className={`${s.input} ${s.inputDisabled}`}
                  value={durationLabel}
                  disabled
                  aria-disabled="true"
                />
                <span className={s.hint}>Duration (calculated from time)</span>
              </div>

              <div className={s.row}>
                <label htmlFor="day" className={s.label}>
                  Classroom Day:
                </label>
                <div className={s.selectWrap}>
                  <select
                    id="day"
                    name="day"
                    className={s.select}
                    value={form.day}
                    onChange={onChange}
                    required
                  >
                    <option value="" disabled>
                      Classroom Day
                    </option>
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                  <span className={s.selectCaret} aria-hidden="true">
                    ▾
                  </span>
                </div>
              </div>

              <div className={s.row}>
                <label className={s.label}>Classroom Time:</label>
                <div className={s.timeRow}>
                  <input
                    type="time"
                    name="start_time"
                    className={s.input}
                    value={form.start_time}
                    onChange={onChange}
                    required
                  />
                  <span className={s.toText}>To</span>
                  <input
                    type="time"
                    name="end_time"
                    className={s.input}
                    value={form.end_time}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>

              <div className={s.row}>
                <label htmlFor="capacity" className={s.label}>
                  Classroom Student Capacity:
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  className={s.input}
                  placeholder="Student Number"
                  value={form.capacity}
                  onChange={onChange}
                  required
                />
              </div>

              {error && (
                <p className={s.error} role="alert">
                  {error}
                </p>
              )}

              <div className={s.actions}>
                <Link
                  to={`/instructor/course/${courseId}/lesson/${lessonId}`}
                  className={s.discardBtn}
                >
                  Discard
                </Link>

                <button
                  type="submit"
                  className={s.createBtn}
                  disabled={submitting}
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>

      {showSuccess && (
        <div className={s.modalOverlay} role="dialog" aria-modal="true">
          <div className={s.modalCard}>
            <h3 className={s.modalTitle}>Classroom Created Successfully!</h3>
            <button
              className={s.modalCta}
              onClick={() =>
                navigate(`/instructor/course/${courseId}/lesson/${lessonId}`, {
                  replace: true,
                })
              }
            >
              Go to lesson detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
