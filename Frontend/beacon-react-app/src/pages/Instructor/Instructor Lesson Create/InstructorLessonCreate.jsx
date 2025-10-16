import React, { useState, useEffect } from "react";
import i from "./InstructorLessonCreate.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../../../api";

export default function InstructorLessonCreation({ onCourseCreated }) {
  const navigate = useNavigate();
  const { lessonId, courseId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [prereqInput, setPrereqInput] = useState("");
  const [readingListInput, setReadingListInput] = useState("");
  const [assignmentsInput, setAssignmentsInput] = useState("");

  // turn null/undefined into "", keep numbers as strings for <input>/<select>
  const asStr = (v) => (v === null || v === undefined ? "" : String(v));
  // --- API endpoints (NO url changes required on server) ---
  const LIST_LESSON_CLASSROOMS_URL = (lessonId) =>
    `/instructor/lesson/${lessonId}/classrooms/`; //  existing GET

  const LIST_ALL_MY_CLASSROOMS_URL = `/instructor/classrooms/`;

  const CREATE_ONLINE_CLASS_URL = (lessonId) => [
    `/instructor/lessons/${lessonId}/classrooms/online/`,
    `/instructor/lessons/${lessonId}/classrooms/`,
    `/instructor/classrooms/${lessonId}/online/`,
  ];

  const LINK_CLASSROOM_URLS = (lessonId, classroomId) => [
    `/instructor/lessons/${lessonId}/classrooms/link/`,
    `/instructor/lesson/${lessonId}/classrooms/`,
    `/instructor/classrooms/${classroomId}/link/${lessonId}/`,
  ];

  // POPUP + FORM STATE FOR ONLINE CLASSROOM
  const [showOnlineClassModal, setShowOnlineClassModal] = useState(false);
  const [onlineForm, setOnlineForm] = useState({
    day_of_week: "",
    time_start: "",
    time_end: "",
    zoom_link: "",
    supervisor: "", // UI only for now; backend will infer director from auth user
    duration_weeks: "",
  });
  const [onlineClassrooms, setOnlineClassrooms] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    credits: "",
    duration_weeks: "",
    director: "",
    description: "",
    objectives: "",
  });

  // PHYSICAL CLASSROOM LINKING STATE
  const [showPhysicalList, setShowPhysicalList] = useState(false); // popup #1
  const [availablePhysical, setAvailablePhysical] = useState([]); // rows in popup #1

  const [showLinkForm, setShowLinkForm] = useState(false); // popup #2
  const [selectedClassroom, setSelectedClassroom] = useState(null); // chosen from popup #1
  const [linkForm, setLinkForm] = useState({
    // time/day inputs
    day_of_week: "",
    time_start: "",
    time_end: "",
    supervisor: "", // UI only; backend will infer from auth
  });

  // The card shown on the lesson form (single physical classroom)
  const [linkedPhysical, setLinkedPhysical] = useState(null);

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

  // Open list of unlinked physical classrooms
  const openPhysicalList = () => setShowPhysicalList(true);
  const closePhysicalList = () => {
    setShowPhysicalList(false);
  };

  // Move from popup #1 -> popup #2
  const chooseClassroom = (row) => {
    setSelectedClassroom(row);
    setShowPhysicalList(false);
    setShowLinkForm(true);
  };

  const closeLinkForm = () => {
    setShowLinkForm(false);
    setSelectedClassroom(null);
    setLinkForm({
      day_of_week: "",
      time_start: "",
      time_end: "",
      supervisor: "",
    });
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

  // For discard handling
  const handleDiscard = () => {
    // clear local form state
    resetForm();

    // go back to the course detail screen
    if (courseId) {
      navigate(`/instructor/course/${courseId}`);
    } else {
      // fallback if no courseId in URL
      navigate(-1);
    }
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

  // For form filling if information was provided before
  // Load lesson details and prefill the form when the page opens
  useEffect(() => {
    if (!lessonId) return;

    (async () => {
      try {
        const { data } = await api.get(
          `/instructor/lessons/${lessonId}/detail/`
        );
        // data shape from LessonDetails view:
        // { lesson_id, title, credits, description, objectives, duration_weeks, status, created_by, ... }

        setFormData((prev) => ({
          ...prev,
          lesson_id: asStr(data.lesson_id),
          title: asStr(data.title),
          credits:
            data.credits === null || data.credits === undefined
              ? ""
              : String(data.credits),
          duration_weeks:
            data.duration_weeks === null || data.duration_weeks === undefined
              ? ""
              : String(data.duration_weeks),
          description: asStr(data.description),
          objectives: asStr(data.objectives),
          status: asStr(data.status || "Inactive"),
          // pick whichever field you want displayed for "designer"
          designer: asStr(data.created_by), // or keep "", depending on your UI
        }));

        // to prefill prerequisites too (optional) and have a GET endpoint for it:
        const pre = await api.get(
          `/instructor/lessons/${lessonId}/prerequisites/`
        );
        setPrereqInput(
          pre.data?.prerequisites?.map((p) => p.lesson_id).join(", ") || ""
        );
      } catch (err) {
        console.error("Failed to load lesson details", err);
      }
    })();
  }, [lessonId]);

  // For online classroom creation
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        const online_classroom_payload = {
          capacity: formData.capacity,
          location: "",
          is_online: true,
          zoom_link: formData.zoom_link,
        };
        const { data } = await api.get();
        const online_lessonclassroom_payload = {
          day_of_week: formData.day_of_week,
          time_start: formData.time_start,
          time_end: formData.time_end,
        };
        const online_lessonclassroom = await api.get();
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

    if (
      formData.duration_weeks !== "" &&
      Number.isFinite(durationNum) &&
      (durationNum < 2 || durationNum > 4)
    ) {
      alert("Duration weeks must be 2-4.");
      return;
    }

    const submitPrereqs = async () => {
      /**Handle prerequisites submission */
      // split by commas / whitespace / newlines
      const prereqIds = prereqInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (prereqIds.length === 0) {
        return;
      } //Nothing entered --> Just leave

      try {
        const res = await api.post(
          `instructor/lessons/${lessonId}/prerequisites/`,
          { prerequisites: prereqIds, mode: "merge" } // or "replace"
        );
        console.log("Created:", res.data);
      } catch (err) {
        console.error("Server error:", err?.response?.data || err);
        alert("Failed to set prerequisites.");
      }
    };

    const payload = {
      lesson_id: formData.lesson_id || lessonId,
      course: courseId,
      ...(formData.title?.trim() ? { title: formData.title } : {}),
      ...(formData.description?.trim()
        ? { description: formData.description }
        : {}),
      ...(formData.objectives?.trim()
        ? { objectives: formData.objectives }
        : {}),
      ...(formData.duration_weeks !== ""
        ? { duration_weeks: formData.duration_weeks }
        : {}),
      ...(formData.credits?.trim() ? { credits: creditsNum } : {}),
      status: formData.status,
      ...(formData.designer?.trim()
        ? { designer_input: formData.designer.trim() } // email string
        : {}),
    };

    try {
      await api.patch(`/instructor/lessons/${lessonId}/update`, payload);
      submitPrereqs();

      if (readingListInput.trim()) {
        await api.post(
          `/instructor/lessons/${lessonId}/readings/`,
          { lesson_id: lessonId, items: readingListInput },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      if (assignmentsInput.trim()) {
        await api.post(
          `/instructor/lessons/${lessonId}/assignments/`,
          { lesson_id: lessonId, items: assignmentsInput },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      alert("Lesson saved successfully!");
      navigate(`/instructor/course/${courseId}`);
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Error saving lesson. Please try again.");
    }
  };

  // For physical classroom linking
  useEffect(() => {
    if (!showPhysicalList) return;

    (async () => {
      try {
        const { data } = await api.get(LIST_ALL_MY_CLASSROOMS_URL);
        const rows = Array.isArray(data) ? data : data?.results || [];

        // physical = has a location (and/or not online if the API returns is_online)
        const physical = rows.filter(
          (r) => !!r.location && r.is_online !== true
        );

        setAvailablePhysical(
          physical.map((r) => ({
            classroom_id: r.classroom_id,
            location: r.location,
            capacity: r.capacity ?? 0,
            type: "Physical",
          }))
        );
      } catch (err) {
        console.error("Failed to load available classrooms", err);
        setAvailablePhysical([]);
      }
    })();
  }, [showPhysicalList]);

  // Display linked classroom
  useEffect(() => {
    if (!lessonId) return;

    (async () => {
      try {
        const { data } = await api.get(LIST_LESSON_CLASSROOMS_URL(lessonId));
        const rows = Array.isArray(data) ? data : [];
        // Physical heuristic: has location
        const physicalLinked = rows.find((r) => r.location ?? null);
        if (physicalLinked) {
          setLinkedPhysical({
            classroom_id: physicalLinked.classroom_id,
            location: physicalLinked.location,
            day_of_week: physicalLinked.day_of_week || "",
            time_start: physicalLinked.time_start || "",
            time_end: physicalLinked.time_end || "",
            duration_minutes: physicalLinked.duration_minutes ?? null,
            capacity: physicalLinked.capacity ?? null,
            supervisor: physicalLinked.supervisor || "", // if your serializer returns it
          });
        } else {
          setLinkedPhysical(null);
        }
      } catch (_) {
        // Non-blocking
      }
    })();
  }, [lessonId]);

  const submitLinkClassroom = async (e) => {
    e.preventDefault();
    if (!lessonId || !selectedClassroom) return;

    const { day_of_week, time_start, time_end, duration_weeks } = linkForm;
    if (!day_of_week) return alert("Please select class day.");

    // Calculate duration in minutes based on inputed time
    let duration_minutes = null;
    if (time_start && time_end) {
      const [h1, m1] = time_start.split(":").map(Number);
      const [h2, m2] = time_end.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      duration_minutes = diff > 0 ? diff : null;
    }

    const bodyA = {
      classroom_id: selectedClassroom.classroom_id,
      day_of_week,
      time_start: time_start || null,
      time_end: time_end || null,
      duration_weeks: duration_weeks || null,
      duration_minutes,
    };

    let saved = false;
    for (const url of LINK_CLASSROOM_URLS(
      lessonId,
      selectedClassroom.classroom_id
    )) {
      try {
        await api.post(url, bodyA);
        saved = true;
        break;
      } catch (_) {
        /* try next */
      }
    }

    // Optimistic update of the card on the form
    setLinkedPhysical({
      classroom_id: selectedClassroom.classroom_id,
      location: selectedClassroom.location,
      day_of_week,
      time_start,
      time_end,
      duration_minutes: null,
      capacity: selectedClassroom.capacity ?? null,
      supervisor: linkForm.supervisor || "",
      _pending: !saved,
    });

    closeLinkForm();

    // If persistence succeeded, refresh fully from backend to show accurate duration/enrollment
    if (saved) {
      try {
        const { data } = await api.get(LIST_LESSON_CLASSROOMS_URL(lessonId));
        const rows = Array.isArray(data) ? data : [];
        const physicalLinked = rows.find((r) => r.location ?? null);
        if (physicalLinked) {
          setLinkedPhysical({
            classroom_id: physicalLinked.classroom_id,
            location: physicalLinked.location,
            day_of_week: physicalLinked.day_of_week || "",
            time_start: physicalLinked.time_start || "",
            time_end: physicalLinked.time_end || "",
            duration_minutes: physicalLinked.duration_minutes ?? null,
            capacity: physicalLinked.capacity ?? null,
            supervisor: physicalLinked.supervisor || "",
          });
        }
      } catch (_) {
        /* ignore */
      }
    } else {
      console.info(
        "Linked locally. Once backend link endpoint is added, this will persist automatically."
      );
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

              <input
                className={i.input}
                type="text"
                name="designer"
                value={formData.designer}
                onChange={handleChange}
                placeholder="Enter instructor email"
              />
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
              <label className={i.label}>Lesson Description:</label>
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

            {/*For physical classroom linkage */}
            <div className={i.row}>
              <label className={i.label}>Physical Classroom:</label>

              <div className={i.physPanel}>
                {linkedPhysical ? (
                  <div className={i.physCard}>
                    <div>
                      <strong>Location:</strong> {linkedPhysical.location}
                    </div>
                    <div className={i.physRow}>
                      <span>
                        <strong>Day:</strong>{" "}
                        {linkedPhysical.day_of_week || "-"}
                      </span>
                      <span>
                        <strong>Time:</strong>{" "}
                        {linkedPhysical.time_start || "-"}
                        {linkedPhysical.time_end
                          ? ` - ${linkedPhysical.time_end}`
                          : ""}
                      </span>
                      <span>
                        <strong>Duration:</strong>{" "}
                        {linkedPhysical.duration_minutes
                          ? `${linkedPhysical.duration_minutes} mins`
                          : "—"}
                      </span>
                    </div>
                    {linkedPhysical._pending && (
                      <div className={i.pending}>pending</div>
                    )}
                  </div>
                ) : (
                  <div className={i.physCardEmpty}>
                    No classroom linked yet.
                  </div>
                )}

                <button
                  type="button"
                  className={i.linkButton}
                  onClick={openPhysicalList}
                >
                  Link Classroom
                </button>
              </div>
            </div>

            {/*For online classroom creation*/}
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
                onClick={handleDiscard}
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

      {/**Popup to show all available classes for linking*/}
      {showPhysicalList && (
        <div className={i.modalOverlay}>
          <div className={i.modalBox}>
            <h3 className={i.modalTitle}>Available Classrooms:</h3>

            <div className={i.pickList}>
              {availablePhysical.length === 0 ? (
                <div className={i.empty}>
                  No unlinked physical classrooms found.
                </div>
              ) : (
                availablePhysical.map((row) => (
                  <div key={row.classroom_id} className={i.pickItem}>
                    <span>
                      <strong>ID:</strong> {row.classroom_id}
                    </span>
                    <span>
                      <strong>Location:</strong> {row.location}
                    </span>
                    <span>
                      <strong>Type:</strong> {row.type}
                    </span>
                    <button
                      className={i.smallSelect}
                      onClick={() => chooseClassroom(row)}
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={i.modalActions}>
              <button className={i.modalBack} onClick={closePhysicalList}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/**Popup for classroom detail setup for linking */}
      {showLinkForm && selectedClassroom && (
        <div className={i.modalOverlay}>
          <div className={i.modalBox}>
            <h3 className={i.modalTitle}>Set time details for class</h3>

            <div className={i.metaRow}>
              <span>
                <strong>ID:</strong> {selectedClassroom.classroom_id}
              </span>
              <span>
                <strong>Location:</strong> {selectedClassroom.location}
              </span>
              <span>
                <strong>Type:</strong> Physical
              </span>
            </div>

            <form onSubmit={submitLinkClassroom} className={i.modalForm}>
              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Day:</label>
                <select
                  className={i.modalInput}
                  value={linkForm.day_of_week}
                  onChange={(e) =>
                    setLinkForm((s) => ({ ...s, day_of_week: e.target.value }))
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
                    value={linkForm.time_start}
                    onChange={(e) =>
                      setLinkForm((s) => ({ ...s, time_start: e.target.value }))
                    }
                  />
                  <span className={i.to}>To</span>
                  <input
                    type="time"
                    className={i.modalInput}
                    value={linkForm.time_end}
                    onChange={(e) =>
                      setLinkForm((s) => ({ ...s, time_end: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Max capacity:</label>
                <div className={i.modalStatic}>
                  {selectedClassroom.capacity ?? "—"}
                </div>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Supervisor:</label>
                <select
                  className={i.modalInput}
                  value={linkForm.supervisor}
                  onChange={(e) =>
                    setLinkForm((s) => ({ ...s, supervisor: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  <option>Dr Jeriko addams</option>
                  <option>Mr. La Pa Ta O Rulwena</option>
                </select>
              </div>

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Duration (Weeks):</label>
                <select
                  className={i.modalInput}
                  value={linkForm.duration_weeks}
                  onChange={(e) =>
                    setLinkForm((s) => ({
                      ...s,
                      duration_weeks: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select duration</option>
                  <option value="2">2 Weeks</option>
                  <option value="3">3 Weeks</option>
                  <option value="4">4 Weeks</option>
                </select>
              </div>

              <div className={i.modalActions}>
                <button
                  type="button"
                  className={i.modalBack}
                  onClick={closeLinkForm}
                >
                  Back
                </button>
                <button type="submit" className={i.modalCreate}>
                  Link class to lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Pop up for online classroom creation */}
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
