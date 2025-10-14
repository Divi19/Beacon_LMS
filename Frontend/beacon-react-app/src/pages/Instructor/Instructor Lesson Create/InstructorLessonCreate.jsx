import React, { useState, useEffect } from "react";
import i from "./InstructorLessonCreate.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../../../api";

export default function InstructorLessonCreation({ onCourseCreated }) {
  const navigate = useNavigate();
  const { lessonId, courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [prereqInput, setPrereqInput] = useState("");
  const [readingListInput, setReadingListInput] = useState("");
  const [assignmentsInput, setAssignmentsInput] = useState("");

  // --- API endpoints (NO url changes required on server) ---
  const LIST_LINKED_CLASSROOMS_URL = (lessonId) =>
    `/instructor/lesson/${lessonId}/classrooms/`; //  existing GET

  const CREATE_ONLINE_CLASS_URL = (lessonId) => [
    `/instructor/lessons/${lessonId}/classrooms/online/`,
    `/instructor/lessons/${lessonId}/classrooms/`,
    `/instructor/classrooms/${lessonId}/online/`,
  ];

  // POPUP + FORM STATE FOR ONLINE CLASSROOM
  const [showOnlineClassModal, setShowOnlineClassModal] = useState(false);
  const [onlineForm, setOnlineForm] = useState({
    day_of_week: "",
    time_start: "",
    time_end: "",
    zoom_link: "",
    supervisor: "", // UI only for now; backend will infer director from auth user
  });
  const [onlineClassrooms, setOnlineClassrooms] = useState([]);

  const submitPrereqs = async () => {
    /**Handle prerequisites submission */
    // split by commas / whitespace / newlines

    const prereqIds = prereqInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (prereqIds.length === 0) {
      return;
    }

    try {
      const res = await api.post(
        `instructor/lessons/${lessonId}/prerequisites/bulk-create/`,
        { prerequisites: prereqIds, mode: "merge" } // or "replace"
      );
      console.log("Created:", res.data);
    } catch (err) {
      console.error("Server error:", err?.response?.data || err);
      alert("Failed to set prerequisites.");
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    credits: "",
    duration_weeks: "",
    director: "",
    description: "",
    objectives: "",
  });

  const openModal = () => {
    setShowModal(true);
  };

  const openModal1 = (e) => {
    e.preventDefault();
    setShowOptionalModal(true);
  };

  const closeModal = () => {
    setLessonInput("");
    setShowModal(false);
  };

  const openOnlineClassModal = () => setShowOnlineClassModal(true);
  const closeOnlineClassModal = () => {
    setOnlineForm({
      day_of_week: "",
      time_start: "",
      time_end: "",
      zoom_link: "",
      supervisor: "",
    });
    setShowOnlineClassModal(false);
  };

  const addLesson = () => {
    if (lessonInput.trim() !== "") {
      setLessons([...lessons, lessonInput.trim()]);
      closeModal();
    }
  };

  const goToCoursePage = () => {
    setShowOptionalModal(false);
    navigate("/instructor/course-list");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      duration_weeks: "",
      credits: "",
      director: "",
      description: "",
      objectives: "",
    });
    setLessons([]);
    setLessonInput("");
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      updated_at: new Date().toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        const { data } = await api.get(LIST_LINKED_CLASSROOMS_URL(lessonId));
        // Expect shape from your ActiveClassroomsView:
        // [{ classroom_id, day_of_week, time_start, time_end, duration_minutes, capacity, ... }]
        const rows = Array.isArray(data) ? data : [];
        setOnlineClassrooms(
          rows.map((r) => ({
            classroom_id: r.classroom_id,
            day_of_week: r.day_of_week || "",
            time_start: r.time_start || "",
            time_end: r.time_end || "",
            duration_minutes: r.duration_minutes ?? null,
            capacity: r.capacity ?? 100, // online defaults
            zoom_link: r.zoom_link || "", // if serializer returns it
          }))
        );
      } catch (e) {
        // non-blocking
        console.warn("Could not load linked online classrooms yet:", e);
      }
    })();
  }, [lessonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const durationNum = Number(formData.duration_weeks);
    const creditsNum =
      formData.credits === "" ? null : Number(formData.credits);

    if (Number.isFinite(durationNum) && (durationNum < 2 || durationNum > 4)) {
      alert("Duration weeks must be 2–4.");
      return;
    }

    const payload = {
      lesson_id: formData.lesson_id || lessonId,
      course: courseId,
      title: formData.title,
      description: formData.description,
      objectives: formData.objectives,
      duration_weeks: durationNum || null,
      credits: creditsNum,
      status: formData.status,
      designer: formData.designer || null,
    };

    try {
      if (lessonId) {
        // Update existing
        await api.patch(`/instructor/lessons/${lessonId}/`, payload);
        await api.post(
          `/instructor/lessons/${lessonId}/prerequisites/bulk-create/`,
          {
            prerequisites: prereqInput.split(/[\s,]+/).filter(Boolean),
            mode: "replace",
          }
        );
      } else {
        // Create new
        const { data } = await api.post(`/instructor/lessons/`, payload);
        await api.post(
          `/instructor/lessons/${data.lesson_id}/prerequisites/bulk-create/`,
          {
            prerequisites: prereqInput.split(/[\s,]+/).filter(Boolean),
            mode: "replace",
          }
        );
      }

      // TODO: Save reading list & assignments via backend endpoints

      alert("Lesson saved successfully!");
      navigate(`/instructor/course/${courseId}`);
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Error saving lesson. Please try again.");
    }
  };

  const submitOnlineClassroom = async (e) => {
    e.preventDefault();
    if (!lessonId) {
      alert("Lesson ID is required to link a classroom.");
      return;
    }
    const { day_of_week, time_start, time_end, zoom_link } = onlineForm;

    if (!day_of_week) return alert("Please select class day.");
    if (!zoom_link.trim()) return alert("Please enter a Zoom link.");

    try {
      // backend will:
      // 1) create Classroom(is_online=True, zoom_link)
      // 2) create LessonClassroom(lesson_id, classroom_id, day_of_week, time_start, time_end, director=auth instructor)
      const payload = {
        is_online: true,
        zoom_link: zoom_link.trim(),
        day_of_week,
        time_start: time_start || null, 
        time_end: time_end || null,
      };

      const { data } = await api.post(
        CREATE_ONLINE_CLASS_URL(lessonId),
        payload
      );

      // Normalize for display (support either flattened or nested serializer)
      const newItem = {
        classroom_id: data?.classroom_id || data?.classroom?.classroom_id,
        day_of_week: data?.day_of_week ?? day_of_week,
        time_start: data?.time_start ?? time_start,
        time_end: data?.time_end ?? time_end,
        duration_minutes: data?.duration_minutes ?? null,
        capacity: data?.capacity ?? 100,
        zoom_link: data?.zoom_link ?? zoom_link.trim(),
      };

      setOnlineClassrooms((prev) => [...prev, newItem]);
      closeOnlineClassModal();
    } catch (err) {
      console.error(
        "Create+link online classroom failed:",
        err?.response?.data || err
      );
      alert(
        "Failed to create online classroom. Please check the backend route."
      );
    }
  };

  return (
    <div className={i.wrap}>
      <div className={i.topBar}>
        <InstructorTopBar />
      </div>
      <header className={i.header}>
        <h1 className={i.title}>LESSON CREATION</h1>
      </header>

      <main className={i.main}>
        <div className={i.formContainer}>
          <form className={i.form} onSubmit={handleSubmit}>
            <div className={i.row}>
              <label className={i.label}>Lesson Title:</label>
              <input
                className={i.input}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson ID:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_id"
                value={formData.lesson_id}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Credits:</label>
              <input
                className={i.input}
                type="text"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Duration:</label>
              <select
                className={i.input}
                name="duration_weeks"
                value={formData.duration_weeks}
                onChange={handleChange}
              >
                <option value="">Select duration</option>
                <option value="2">2 Weeks</option>
                <option value="3">3 Weeks</option>
                <option value="4">4 Weeks</option>
              </select>
            </div>

            <div className={i.row}>
              <label className={i.label}>Estimated Effort:</label>
              <input
                className={i.input}
                type="text"
                name="estimated_effort"
                value={formData.estimated_effort}
                onChange={handleChange}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Designer:</label>
              <select
                className={i.input}
                name="director"
                value={formData.director}
                onChange={handleChange}
              >
                <option value="">Select Instructor</option>
                {/* Later map instructors from backend */}
                <option value="Dr Charles Xavier">Dr Charles Xavier</option>
                <option value="Mr La Pa Ta O Rulwena">
                  Mr La Pa Ta O Rulwena
                </option>
              </select>
            </div>

            <div className={i.row}>
              <label className={i.label}>Last Updated On:</label>
              <input
                className={`${i.input} ${i.readOnly}`}
                value={formData.updated_at}
                readOnly
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Status:</label>
              <select
                className={i.input}
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Inactive">Inactive</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className={i.row}>
              <label className={i.label}>Course Description:</label>
              <textarea
                className={i.input}
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Objectives:</label>
              <textarea
                className={i.input}
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Prerequisite Lessons:</label>
              <textarea
                className={i.input}
                name="prerequisite"
                value={prereqInput}
                onChange={(e) => setPrereqInput(e.target.value)}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Reading List:</label>
              <textarea
                className={i.input}
                name="reading_list"
                value={readingListInput}
                onChange={(e) => setReadingListInput(e.target.value)}
                rows={2}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Assignments:</label>
              <textarea
                className={i.input}
                name="assignments"
                value={assignmentsInput}
                onChange={(e) => setAssignmentsInput(e.target.value)}
                rows={2}
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Physical Classroom:</label>
              <button type="button" className={i.linkButton}>
                Link Classroom
              </button>
            </div>

            <div className={i.row}>
              <label className={i.label}>Online Classroom:</label>

              <div className={i.onlinePanel}>
                {onlineClassrooms.length === 0 ? (
                  <div className={i.onlineCardEmpty}>
                    No online classroom yet.
                  </div>
                ) : (
                  onlineClassrooms.map((c) => (
                    <div key={c.classroom_id} className={i.onlineCard}>
                      <div className={i.onlineRow}>
                        <span>
                          <strong>Day:</strong> {c.day_of_week || "-"}
                        </span>
                        <span>
                          <strong>Time:</strong>{" "}
                          {c.time_start ? c.time_start : "-"}
                          {c.time_end ? ` - ${c.time_end}` : ""}
                        </span>
                        <span>
                          <strong>Duration:</strong>{" "}
                          {c.duration_minutes
                            ? `${c.duration_minutes} mins`
                            : "-"}
                        </span>
                      </div>
                      <div className={i.onlineRow}>
                        <span>
                          <strong>Zoom link:</strong>{" "}
                          {c.zoom_link ? (
                            <a
                              href={c.zoom_link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {c.zoom_link}
                            </a>
                          ) : (
                            "-"
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  className={i.createClassroomButton}
                  onClick={openOnlineClassModal}
                >
                  Create classroom
                </button>
              </div>
            </div>

            <div className={i.buttonRow}>
              <button
                type="button"
                className={i.discardbutton}
                onClick={resetForm}
              >
                Discard
              </button>
              <button type="submit" className={i.createbutton}>
                Update
              </button>
            </div>
          </form>
        </div>
      </main>

      {showOptionalModal && (
        <div className={i.modalOverlay}>
          <div className={i.modalContent}>
            <h3>Lesson saved successfully!</h3>
            <div className={i.modalButtons}>
              <button className={i.selectButton} onClick={goToCoursePage}>
                Go to lesson page
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnlineClassModal && (
        <div className={i.modalOverlay}>
          <div className={i.modalBox}>
            <h3 className={i.modalTitle}>Set online class room details</h3>

            <form onSubmit={submitOnlineClassroom} className={i.modalForm}>
              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Day:</label>
                <select
                  className={i.modalInput}
                  value={onlineForm.day_of_week}
                  onChange={(e) =>
                    setOnlineForm((s) => ({
                      ...s,
                      day_of_week: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select day</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Timing:</label>
                <div className={i.timeWrap}>
                  <input
                    type="time"
                    className={i.modalInput}
                    value={onlineForm.time_start}
                    onChange={(e) =>
                      setOnlineForm((s) => ({
                        ...s,
                        time_start: e.target.value,
                      }))
                    }
                  />
                  <span className={i.to}>To</span>
                  <input
                    type="time"
                    className={i.modalInput}
                    value={onlineForm.time_end}
                    onChange={(e) =>
                      setOnlineForm((s) => ({ ...s, time_end: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Max capacity:</label>
                <div className={i.modalStatic}>100</div>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Supervisor:</label>
                <select
                  className={i.modalInput}
                  value={onlineForm.supervisor}
                  onChange={(e) =>
                    setOnlineForm((s) => ({ ...s, supervisor: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  {/* Optional: later map instructor list here */}
                  <option>Mr. La Pa Ta O Rulwena</option>
                  <option>Dr Jeriko addams</option>
                </select>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Zoom link:</label>
                <input
                  type="text"
                  className={i.modalInput}
                  placeholder="https://zoom.us/j/..."
                  value={onlineForm.zoom_link}
                  onChange={(e) =>
                    setOnlineForm((s) => ({ ...s, zoom_link: e.target.value }))
                  }
                  required
                />
              </div>

              <div className={i.modalActions}>
                <button
                  type="button"
                  className={i.modalBack}
                  onClick={closeOnlineClassModal}
                >
                  Back
                </button>
                <button type="submit" className={i.modalCreate}>
                  Create online classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
