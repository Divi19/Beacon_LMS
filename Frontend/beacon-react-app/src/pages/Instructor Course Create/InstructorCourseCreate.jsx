import React, { useState } from "react";
import i from "./InstructorCourseCreate.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export default function InstructorCourseCreate({ onCourseCreated }) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lessonInput, setLessonInput] = useState("");
  const [showOptionalModal, setShowOptionalModal] = useState(false);

  const [formData, setFormData] = useState({
    courseName: "",
    ID: "",
    credits: "",
    director: "",
    description: "",
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
      courseName: "",
      ID: "",
      credits: "",
      director: "",
      description: "",
    });
    setLessons([]);      
    setLessonInput("");  
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data for Django backend
      const courseData = {
        course_id: formData.ID,
        course_title: formData.courseName,
        course_credits: formData.credits,
        course_director: formData.director,
        course_description: formData.description,
      };

      // Send to Django backend
      await axios.post('http://localhost:8000/courses/frontend', courseData);
      
      console.log("Course created successfully:", courseData);
      
      // Refresh the course list in parent component
      if (onCourseCreated) {
        onCourseCreated();
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
        <h1 className={i.title}>COURSE CREATION</h1>
      </header>
      <div>
        <form className={i.form} onSubmit={handleSubmit}>
          <div className={i.formContainer}>
            <div className={i.row}>
              <label className={i.label}>Course Title:</label>
              <input
                className={i.input}
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Course ID:</label>
              <input
                className={i.input}
                type="text"
                name="ID"
                value={formData.ID}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Course Credits:</label>
              <input
                className={i.input}
                type="text"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Course Director:</label>
              <input
                className={i.input}
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.row}>
              <label className={i.label}>Description:</label>
              <textarea
                className={i.input}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className={i.rowBlock}>
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
            </div>

            {showOptionalModal && (
              <div className={i.modalOverlay}>
                <div className={i.modalContent}>
                  <h3>Course Created Successfully!</h3>
                  <div className={i.modalButtons}>
                    <button className={i.selectButton} onClick={goToCoursePage}>
                      Go to course page
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