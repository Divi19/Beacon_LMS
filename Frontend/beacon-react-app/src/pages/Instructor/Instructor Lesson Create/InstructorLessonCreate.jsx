import React, { useState } from "react";
import i from "./InstructorLessonCreate.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api } from "../../../api";

export default function InstructorLessonCreation({ onCourseCreated }) {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [prereqInput, setPrereqInput] = useState("");

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
                `instructor/lessons/${lessonId}/prerequisites/bulk-create/`,
                { prerequisites: prereqIds, mode: "merge" }, // or "replace"
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for Django backend
      const lessonData = {
        title: formData.title,
        duration_weeks: formData.duration_weeks,
        credits: formData.credits,
        description: formData.description,
        objectives: formData.description,
        status: "Active" //After done updating 
      };

            // Send to Django backend
            submitPrereqs(); //creating prereqs
            await api.patch(
                `/instructor/lessons/${lessonId}/create/`,
                lessonData,
            );
            console.log("Course created successfully:", lessonData);

            // Refresh the course list in parent component
            if (onCourseCreated) {
                onCourseCreated();
            }

            // Show success modal
            setShowOptionalModal(true);
        } catch (error) {
            console.error("Error creating lesson:", error);
            alert("Error creating lesson. Please try again.");
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
            <div>
                <form className={i.form} onSubmit={handleSubmit}>
                    <div className={i.formContainer}>
                        <div className={i.row}>
                            <label className={i.label} htmlFor="title">
                                Lesson Title:
                            </label>
                            <input
                                className={i.input}
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={i.row}>
                            <label className={i.label} htmlFor="credits">
                                Lesson Credits:
                            </label>
                            <input
                                className={i.input}
                                id="credits"
                                type="number"
                                name="credits"
                                value={formData.credits}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={i.row}>
                            <label className={i.label} htmlFor="duration_weeks">
                                Lesson Duration:
                            </label>
                            <input
                                className={i.input}
                                id="duration_weeks"
                                type="number"
                                name="duration_weeks"
                                value={formData.duration_weeks}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={i.row}>
                            <label className={i.label} htmlFor="description">
                                Lesson Description:
                            </label>
                            <textarea
                                className={i.input}
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={i.row}>
                            <label className={i.label} htmlFor="objectives">
                                Lesson Objective:
                            </label>
                            <textarea
                                className={i.input}
                                id="objectives"
                                name="objectives"
                                value={formData.objectives}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={i.row}>
                            <label className={i.label} htmlFor="prerequisite">
                                Prerequisite Lesson:
                            </label>
                            <textarea
                                className={i.input}
                                id="prerequisite"
                                name="prerequisite"
                                value={prereqInput}
                                onChange={e => setPrereqInput(e.target.value)}
                            />
                        </div>

                        {showOptionalModal && (
                            <div className={i.modalOverlay}>
                                <div className={i.modalContent}>
                                    <h3>Lesson Created Successfully!</h3>
                                    <div className={i.modalButtons}>
                                        <button
                                            className={i.selectButton}
                                            onClick={goToCoursePage}
                                        >
                                            Go to lesson page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={i.buttonRow}>
                            <button
                                className={i.discardbutton}
                                type="button"
                                onClick={resetForm}
                            >
                                Discard
                            </button>
                            <button className={i.createbutton} type="submit">
                                Create
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
