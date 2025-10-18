import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import i from "./InstructorClassCreation.module.css";
import { api } from "../../../api";

export default function InstructorClassCreation() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [persisted, setPersisted] = useState(true);

  const goToInstructorClassrooms = () => navigate("/instructor/classrooms");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      alert("Please enter a classroom location.");
      return;
    }
    setSubmitting(true);

    const payload = {capacity: capacity, location: location.trim(), is_online: false, zoom_link: ""};
    if (capacity > 10){
        alert("Classroom capacity must be less than 10")
        return 
    }

    let saved = false;
    try {
      await api.post("/instructor/classrooms/create/", payload);
      saved = true
      setPersisted(saved);
      setSuccessOpen(true);
      setSubmitting(true);
    } catch (e) {
      setPersisted(saved);
      setSubmitting(false);
      console.log("Failed to create classrooms", e)
      alert("Failed to create classrooms.")
    }
  
  };

  const handleGoToLesson = () => {
    setSuccessOpen(false);
    goToInstructorClassrooms();
  };

  return (
    <div className={i.wrap}>
      <InstructorTopBar />
      <h1 className={i.title}>CLASSROOM CREATION</h1>

      <form className={i.card} onSubmit={handleSubmit}>
        <h3 className={i.section}>Classroom Details</h3>

        <div className={i.row}>
          <label>Classroom Location:</label>
          <input
            placeholder="Classroom Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className={i.row}>
          <label>Classroom capacity:</label>
          <input
            placeholder="10"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div className={i.row}>
          <label>Class Type:</label>
          <div className={i.readonly}>Physical</div>
        </div>

        <div className={i.actions}>
          <button
            type="button"
            className={i.discard}
            onClick={goToInstructorClassrooms}
            disabled={submitting}
          >
            Discard
          </button>
          <button type="submit" className={i.create} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

      {successOpen && (
        <div className={i.backdrop}>
          <div className={i.modal}>
            <h2>Classroom Created Successfully!</h2>
            {!persisted && (
              <p className={i.note}>
                (Backend endpoint not active — shown for flow only.)
              </p>
            )}
            <button className={i.go} onClick={goToInstructorClassrooms}>
              Go to classrooms
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
