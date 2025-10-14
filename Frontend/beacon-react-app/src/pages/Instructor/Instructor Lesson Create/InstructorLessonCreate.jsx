import React, { useState, useEffect } from "react";
import i from "./InstructorLessonCreate.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../../../api";

export default function InstructorLessonCreation({ onCourseCreated }) {
  const navigate = useNavigate();
  const { lessonId, courseId } = useParams();
  const [lesson, setLesson] = useState(null)
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [prereqInput, setPrereqInput] = useState("");
  const [readingListInput, setReadingListInput] = useState("");
  const [assignmentsInput, setAssignmentsInput] = useState("");

    
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

    const openModal1 = e => {
        e.preventDefault();
        setShowOptionalModal(true);
    };

    const closeModal = () => {
        setLessonInput("");
        setShowModal(false);
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

    const handleChange = e => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const durationNum = Number(formData.duration_weeks);
    const creditsNum = formData.credits === "" ? null : Number(formData.credits);

    if (formData.duration_weeks !== "" && Number.isFinite(durationNum) && (durationNum < 2 || durationNum > 4)) {
      alert("Duration weeks must be 2–4.");
      return;
    }



  const submitPrereqs = async () => {
    /**Handle prerequisites submission */
    // split by commas / whitespace / newlines
    const prereqIds = prereqInput
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(Boolean);

    if (prereqIds.length === 0) {
        return;
    } //Nothing entered --> Just leave

    try {
        const res = await api.post(
            `instructor/lessons/${lessonId}/prerequisites/`,
            { prerequisites: prereqIds, mode: "merge" }, // or "replace"
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
    ...(formData.title?.trim()
        ? {title: formData.title}
        : {}
        ),
    ...(formData.description?.trim()
        ? {description: formData.description}
        : {}
        ),
    ...(formData.objectives?.trim()
        ? {objectives: formData.objectives}
        : {}
        ),
    ...(formData.duration_weeks !== ""
        ? {duration_weeks: formData.duration_weeks}
        : {}
        ),
    ...(formData.credits?.trim()
        ? {credits: creditsNum}
        : {}
        ),
    status: formData.status,
    ...(formData.designer?.trim()
        ? { designer: formData.designer.trim() }   // email string
        : {}),
  };

  try {
      await api.patch(`/instructor/lessons/${lessonId}/update/`, payload);
      submitPrereqs()


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
              name="assignments" value={assignmentsInput}
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
              <button type="button" className={i.createClassroomButton}>
                Create Classroom
              </button>
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
    </div>
  );
}
