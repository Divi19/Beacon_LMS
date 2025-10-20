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


  // turn null/undefined into "", keep numbers as strings for <input>/<select>
  const asStr = (v) => (v === null || v === undefined ? "" : String(v));
  // --- API endpoints (NO url changes required on server) ---
  const LIST_LESSON_CLASSROOMS_URL = (lessonId) =>
    `/instructor/lesson/classrooms/`; // existing GET and pass lessonId params

  // --- PLACEHOLDERS the backend can wire later ---
  const ONLINE_LIST_SHOWING = (lessonId) =>
    `/instructor/classrooms/online/${lessonId}/`; // GET: online classrooms for a lesson

  const ONLINE_LINKING = (lessonId) =>
    `/instructor/classrooms/online/${lessonId}/`; //POST: online classroom linking to a lesson 

  const PHYSICAL_LINKING = (lessonId) => 
    `/instructor/link_classrooms/link/${lessonId}/`; 


  // POPUP + FORM STATE FOR ONLINE CLASSROOM
  const [showOnlineClassModal, setShowOnlineClassModal] = useState(false);
  const [onlineForm, setOnlineForm] = useState({
    day_of_week: "",
    time_start: "",
    time_end: "",
    zoom_link: "",
    supervisor_input: "",
    duration_weeks: "",
  });
  const [onlineClassrooms, setOnlineClassrooms] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    credits: "",
    estimated_effort:0,
    duration_weeks: "",
    designer_email: "",
    description: "",
    objectives: "",
    supervisor: ""
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
    duration_weeks: "",
    supervisor: "", // UI only; backend will infer from auth
  });

  // The card shown on the lesson form (single physical classroom)
  const [physicalClassrooms, setPhysicalClassrooms] = useState([]);

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
      supervisor_input: "",
      is_online: true
    });
    setShowOnlineClassModal(false);
  };

  const addLesson = () => {
    if (lessonInput.trim() !== "") {
      setLessons([...lessons, lessonInput.trim()]);
      closeModal();
    }
  };

  const goToLessonPage = () => {
    setShowOptionalModal(false);
    navigate(`/instructor/course/${courseId}/lesson/${lessonId}`);
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
      estimated_effort: 0,
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
        const { data: asgn_data } = await api.get(`/instructor/assignments/${lessonId}/`);
        const { data: read_data } = await api.get(`/instructor/readings/${lessonId}/`);
        const { data: prereqs_data} = await api.get(`/instructor/prereqs/${lessonId}/`);
        
        setAssignmentsInput(asgn_data.assignments_text);
        setReadingListInput(read_data.readings_text);
        setPrereqInput(prereqs_data.prereqs_text)
        
        const { data } = await api.get(
          `/instructor/lessons/${lessonId}/detail/`
        );
        // data shape from LessonDetails view:
        // { lesson_id, title, credits, description, objectives, duration_weeks, status, created_by, ... }

        setFormData((prev) => ({
          ...prev,
          lesson_id: asStr(data.lesson_id),
          title: asStr(data.title),
          estimated_effort: 
            data.estimated_effort? Number(data.estimated_effort) : 0,
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
          // display designer's email
          designer_email: asStr(data.designer_email), 
        }));
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
        const { data } = await api.get(
          `instructor/classrooms/online/${lessonId}/`
        );
        setOnlineClassrooms(data);
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
      let prereqIds = prereqInput
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (prereqIds.length === 0) {
        prereqIds = ""
      } //Nothing entered --> Just leave

      try {
        const res = await api.post(
          `instructor/lessons/${lessonId}/prerequisites/`,
          { prerequisites: prereqIds, mode: "replace" } // or "replace"
        );
        console.log("Created:", res.data);
      } catch (err) {
        console.error("Server error:", err?.response?.data || err);
        alert("Failed to set prerequisites.");
      }
    };

    const payload = {
      lesson_id: lessonId,
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
      ...(formData.designer_email?.trim()
        ? { designer_input: formData.designer_email.trim() } //email string
        : {}),
        ...(formData.estimated_effort?
        { estimated_effort: formData.estimated_effort} 
        : {}),
    };

    try {
      await api.patch(`/instructor/lessons/${lessonId}/update/`, payload);
      submitPrereqs();

      if (readingListInput.trim()) {
        await api.post(
          `/instructor/lessons/${lessonId}/readings/`,
          { lesson_id: lessonId, items: readingListInput, mode: "replace" },
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        await api.post(
          `/instructor/lessons/${lessonId}/readings/`,
          { lesson_id: lessonId, items: "", mode: "replace" },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      //----------for submitting readings and assignments--
      if (assignmentsInput.trim()) {
        await api.post(
          `/instructor/lessons/${lessonId}/assignments/`,
          { lesson_id: lessonId, items: assignmentsInput, mode: "replace" },
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        await api.post(
          `/instructor/lessons/${lessonId}/assignments/`,
          { lesson_id: lessonId, items: "", mode: "replace" },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      alert("Lesson saved successfully!");
      setShowOptionalModal(true);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const data = error.response.data;
        const message =
          data.credits?.[0] ||                 // e.g. {"credits": ["Credits exceed limit"]}
          data.non_field_errors?.[0] ||        // e.g. {"non_field_errors": ["..."]}
          "Validation failed. Please check your input.";
        alert(message)
      } else {
        console.error("Error saving lesson:", error);
        alert("Error saving lesson. Please try again.");
      }

     
    }
  };

  //----------------For physical classroom linking
  useEffect(() => {
    if (!showPhysicalList) return;

    (async () => {
      try {
        const { data } = await api.get(`/instructor/link_classrooms/get/${courseId}/`);
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

  // Use effect to fetch one combined list:
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        //Linked to specific lesson
        const { data } = await api.get(LIST_LESSON_CLASSROOMS_URL(lessonId), {params: {lesson_id: lessonId}});
        const rows = Array.isArray(data) ? data : data?.results || [];

        // Split physical vs online heuristically
        const physical = rows.filter(
          (r) => !!r.location || r.is_online === false
        );
        const online = rows.filter(
          (r) => r.is_online === true || (!!r.zoom_link && !r.location)
        );

        setPhysicalClassrooms(
          physical.map((r) => ({
            classroom_id: r.classroom_id,
            location: r.location,
            day_of_week: r.day_of_week || "",
            time_start: r.time_start || "",
            time_end: r.time_end || "",
            duration_minutes: r.duration_minutes ?? null,
            duration_weeks: r.duration_weeks ?? null,
            capacity: r.capacity ?? null,
            supervisor: r.supervisor || r.director || "",
          }))
        );

        setOnlineClassrooms(
          online.map((r) => ({
            classroom_id: r.classroom_id,
            zoom_link: r.zoom_link || "",
            day_of_week: r.day_of_week || "",
            time_start: r.time_start || "",
            time_end: r.time_end || "",
            duration_minutes: r.duration_minutes ?? null,
            duration_weeks: r.duration_weeks ?? null,
            capacity: r.capacity ?? 100,
            supervisor: r.supervisor || r.director || "",
          }))
        );
      } catch (e1) {
        // 2) If the combined endpoint doesn’t exist yet, fall back to placeholders
        try {
          const [{ data: on }] = await Promise.all([
            api.get(ONLINE_LIST_SHOWING(lessonId)),
            // you can add a separate physical list endpoint if you have one
          ]);

          setOnlineClassrooms(
            (Array.isArray(on) ? on : on?.results || []).map((r) => ({
              classroom_id: r.classroom_id,
              zoom_link: r.zoom_link || "",
              day_of_week: r.day_of_week || "",
              time_start: r.time_start || "",
              time_end: r.time_end || "",
              duration_minutes: r.duration_minutes ?? null,
              duration_weeks: r.duration_weeks ?? null,
              capacity: r.capacity ?? 100,
              supervisor: r.supervisor || r.director || "",
            }))
          );
        } catch (e2) {
          console.warn("Could not load linked classrooms yet:", e1, e2);
        }
      }
    })();
  }, [lessonId]);

  const submitLinkClassroom = async (e) => {
    e.preventDefault();
    if (!lessonId || !selectedClassroom) return;

    const { day_of_week, time_start, time_end, supervisor, duration_weeks } =
      linkForm || {};
    if (!day_of_week) return alert("Please select class day.");

    // Calculate duration in minutes based on inputed.
    let duration_minutes = null;
    if (time_start && time_end) {
      const [h1, m1] = time_start.split(":").map(Number);
      const [h2, m2] = time_end.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      duration_minutes = diff > 0 ? diff : null;
    }

    const body = {
      classroom_id: selectedClassroom.classroom_id,
      day_of_week,
      time_start: time_start || null,
      time_end: time_end || null,
      duration_weeks: duration_weeks || null,
      duration_minutes,
      supervisor_input: supervisor || null,
    };

    try {
      // Prefer the single placeholder endpoint; keep your fallback list if you want
      await api.post(PHYSICAL_LINKING(lessonId), body);
      const { data } = await api.get(LIST_LESSON_CLASSROOMS_URL(lessonId), {params: {lesson_id: lessonId}});
      const rows = Array.isArray(data) ? data : data?.results || [];
      const physical = rows.filter(
          (r) => !!r.location || r.is_online === false
        );
      // on success: push into list
      setPhysicalClassrooms(physical);
    } catch (err) {
      console.error(
        "Link physical classroom failed:",
        err?.response?.data || err
      );
      alert("Failed to link classroom. Please ensure the sessions do not overlap for the same classroom and instructor.");
      // no optimistic card on failure
    } finally {
      //  always let the user out of the modal
      closeLinkForm();
    }
  };

  const submitOnlineClassroom = async (e) => {
    e.preventDefault();
    if (!lessonId) {
      alert("Lesson ID is required to link a classroom.");
      return;
    }
    const {
      day_of_week,
      time_start,
      time_end,
      zoom_link,
      supervisor_input,
      duration_weeks,
    } = onlineForm || {};

    if (!day_of_week) return alert("Please select class day.");
    if (!zoom_link.trim()) return alert("Please enter a Zoom link.");

    let duration_minutes = null;
    if (time_start && time_end) {
      const [h1, m1] = time_start.split(":").map(Number);
      const [h2, m2] = time_end.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      duration_minutes = diff > 0 ? diff : null;
    }

    const payload = {
      is_online: true,
      zoom_link: zoom_link.trim(),
      day_of_week,
      time_start: time_start || null,
      time_end: time_end || null,
      duration_weeks: duration_weeks || null,
      duration_minutes,
      supervisor_input: supervisor_input || null,
      capacity: 100,
      location: "",
      is_online: true

    };

    try {
      await api.post(ONLINE_LINKING(lessonId), payload);
      
      const [{ data: on }] = await Promise.all([
          api.get(ONLINE_LIST_SHOWING(lessonId)),
        ]);

      setOnlineClassrooms(
          (Array.isArray(on) ? on : on?.results || []).map((r) => ({
            classroom_id: r.classroom_id,
            zoom_link: r.zoom_link || "",
            day_of_week: r.day_of_week || "",
            time_start: r.time_start || "",
            time_end: r.time_end || "",
            duration_minutes: r.duration_minutes ?? null,
            duration_weeks: r.duration_weeks ?? null,
            capacity: r.capacity ?? 100,
            supervisor: r.supervisor || r.director || "",
          }))
        );
      
    } catch (err) {
      console.error(
        "Create+link online classroom failed:",
        err?.response?.data || err
      );
      alert(
        "Failed to create online classroom. Please check the backend route."
      );
    } finally {
      closeOnlineClassModal();
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
                value={formData.designer_email}
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
                placeholder="Press return/enter for next item"
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Prerequisite Lessons:</label>
              <textarea
                className={i.input}
                name="prerequisite"
                value={prereqInput}
                onChange={(e) => setPrereqInput(e.target.value)}
                placeholder="Enter Lesson ID separated by comma"
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
                placeholder="Title | URL [Press enter for next reading item]"
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
                placeholder="Title | Description [Press enter for next assignment]"
              />
            </div>

            {/*For physical classroom linkage */}
            <div className={i.row}>
              <label className={i.label}>Physical Classroom:</label>

              <div className={i.physPanel}>
                {physicalClassrooms.length === 0 ? (
                  <div className={i.physCardEmpty}>
                    No classroom linked yet.
                  </div>
                ) : (
                  physicalClassrooms.map((pc) => (
                    <div key={pc.lesson_classroom_id} className={i.physCard}>
                      <div>
                        {pc.location || "-"} 
                      </div>
                      <div className={i.physRow}>
                      <span> <strong>Supervisor: </strong> {pc.supervisor}</span>
                        <span>
                          <strong> {pc.day_of_week || "-"} &nbsp;&nbsp;</strong>
                          {pc.time_start || "-"}
                          {pc.time_end ? ` - ${pc.time_end}` : ""}
                        </span>
                        <span>
                          <strong>Duration:</strong>{" "}
                          {pc.duration_minutes
                            ? `${pc.duration_minutes} mins`
                            : "—"}
                        </span>
                        <span>
                          <strong>Weeks:</strong>{" "}
                          {pc.duration_weeks ? `${pc.duration_weeks}` : "—"}
                        </span>
                      </div>
                    </div>
                  ))
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
                      <div className={i.onlineRow}>
                        <span> <strong>Supervisor: </strong> {c.supervisor}
                        </span>
                          <strong>{c.day_of_week || "-"}</strong>  
                            {c.time_start ? c.time_start : "-"}
                            {c.time_end ? ` - ${c.time_end}` : ""}
                        <span>
                          <strong>Duration:</strong>{" "}
                          {c.duration_minutes
                            ? `${c.duration_minutes} mins`
                            : "-- mins"}
                        </span>
                        <span>
                          <strong>Weeks:</strong>{" "}
                          {c.duration_weeks ? `${c.duration_weeks}` : "—"}
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
              <button className={i.selectButton} onClick={goToLessonPage}>
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
                <input
                  className={i.input}
                  type="email"
                  name="supervisor"
                  value={linkForm.supervisor}
                  onChange={(e) =>
                    setLinkForm((s) => ({
                      ...s,
                      supervisor: e.target.value,
                    }))
                  }
                  placeholder="Enter instructor email"
                />
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
                <input
                  className={i.input}
                  type="email"
                  name="supervisor"
                  value={onlineForm.supervisor_input}
                  onChange={(e) =>
                    setOnlineForm((s) => ({ ...s, supervisor_input: e.target.value }))
                  }
                  placeholder="Enter instructor email"
                />
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

              <div className={i.modalRow}>
                <label className={i.modalLabel}>Class Duration (Weeks)</label>
                <select
                  className={i.modalInput}
                  value={onlineForm.duration_weeks}
                  onChange={(e) =>
                    setOnlineForm((s) => ({
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
                  onClick={closeOnlineClassModal}
                >
                  Back
                </button>
                <button type="submit" className={i.modalCreate}>
                  Create Online Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
