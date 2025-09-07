import React, { useState } from "react";
import i from "./InstructorCourseCreate.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import { useNavigate } from "react-router-dom";

export default function InstructorCourseCreate() {
  const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
const [showModal, setShowModal] = useState(false);
const [lessonInput, setLessonInput] = useState("");

const [showOptionalModal, setShowOptionalModal] = useState(false);

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

const handleSubmit = (e) => {
  e.preventDefault();
  console.log("Form Data:", formData);
  setShowOptionalModal(true); 
};

const resetForm = () => {
  setFormData({
    courseName: "",
    ID: "",
    credits: "",
    director: "",
    description: "",
    duration: "",
  });
  setLessons([]);      
  setLessonInput("");  
};


  const [formData, setFormData] = useState({
    courseName: "",
    ID: "",
    credits: "",
    director: "",
    description: "",
    duration: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit1 = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    alert("Course Created!");
    goToCoursePage()
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
  <form className={i.form} onSubmit={handleSubmit}>
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

    <div className={i.row}>
      <label className={i.label}>Duration:</label>
      <input
        className={i.input}
        type="text"
        name="duration"
        value={formData.duration}
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
      <h3>Course Created</h3>
      <div className={i.modalButtons}>
        <button className={i.selectButton} onClick={goToCoursePage}>
          Go to course page
        </button>
      </div>
    </div>
  </div>
)}


    <div className={i.buttonRow}>
  <button className={i.discardbutton} type="button" onClick={resetForm}>Discard</button>
  <button className={i.createbutton} type="submit" onClick={openModal1}>Create</button>
</div>
  </form>
</div>
    </form>
    </div>
    </div>
  );
}
