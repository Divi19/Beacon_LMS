import React, { useState } from "react";
import i from "./InstructorLessonCreate.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';

export default function InstructorLessonCreate({ onLessonCreated }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);

  const [formData, setFormData] = useState({
    lesson_title: "",
    lesson_id: "",
    lesson_credits: "",
    lesson_duration: "",
    lesson_description: "",
    lesson_objective: "",
    lesson_prerequisite: "",
    courses: "",
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

  const addLesson = () => {
    if (lessonInput.trim() !== "") {
      setLessons([...lessons, lessonInput.trim()]);
      closeModal();
    }
  };

  const goToLessonPage = () => {
    setShowOptionalModal(false); 
    navigate("/instructor/lesson-list"); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
        lesson_title: "",
        lesson_id: "",
        lesson_credits: "",
        lesson_duration: "",
        lesson_description: "",
        lesson_objective: "",
        lesson_prerequisite: "",
        courses: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data for Django backend
      const lessonData = {
        lesson_title: formData.lesson_title,
        lesson_id: formData.lesson_id,
        lesson_credits: parseInt(formData.lesson_credits),
        lesson_duration: parseInt(formData.lesson_duration),
        lesson_description: formData.lesson_description,
        lesson_objective: formData.lesson_objective,
        lesson_prerequisite: formData.lesson_prerequisite,
        courses: courseId,
      };

      // Send to Django backend
      await axios.post(`http://localhost:8000/courses/${courseId}/lessons/`, lessonData);
      
      console.log("Lesson created successfully:", lessonData);
      
      // Refresh the course list in parent component
      if (onLessonCreated) {
        onLessonCreated(lessonData);
      }
      
      // Show success modal
      setShowOptionalModal(true);
      
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course. Please try again.');
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
              <label className={i.label}>Lesson Title:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_title"
                value={formData.lesson_title}
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
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Credits:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_credits"
                value={formData.lesson_credits}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Duration:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_duration"
                value={formData.lesson_duration}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Description:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_description"
                value={formData.lesson_description}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Objective:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_objective"
                value={formData.lesson_objective}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Lesson Prerequisite:</label>
              <input
                className={i.input}
                type="text"
                name="lesson_prerequisite"
                value={formData.lesson_prerequisite}
                onChange={handleChange}
                required
              />
            </div>

            {/* <div className={i.row}>
              <label className={i.label}>Description:</label>
              <textarea
                className={i.input}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div> */}

            {/* <div className={i.rowBlock}>
              <div className={i.lessonHeader}>
                <span className={i.label}>Course Core Lessons:</span>

                <div className={i.lessonList}>
                  {lessons.map((lesson, index) => (
                    <div key={index} className={i.lessonItem}>
                      {lesson}
                    </div>
                  ))}
                </div>

                <button type="button" className={i.addButton} onClick={openModal}>
                  +
                </button>
                <span className={i.addText}>Add Lessons</span>
              </div>

              {showModal && (
                <div className={i.modalOverlay}>
                  <div className={i.modalContent}>
                    <h3>Add Core Lesson</h3>
                    <input
                      type="text"
                      value={lessonInput}
                      onChange={(e) => setLessonInput(e.target.value)}
                      className={i.input}
                      placeholder="Enter lesson name"
                    />
                    <div className={i.modalButtons}>
                      <button className={i.selectButton} onClick={addLesson}>
                        Select
                      </button>
                      <button className={i.cancelButton} onClick={closeModal}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div> */}

            {showOptionalModal && (
              <div className={i.modalOverlay}>
                <div className={i.modalContent}>
                  <h3>Lesson Created Successfully!</h3>
                  <div className={i.modalButtons}>
                    <button className={i.selectButton} onClick={goToLessonPage}>
                      Go to lesson page
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={i.buttonRow}>
              <button className={i.discardbutton} type="button" onClick={resetForm}>
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