import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./AdminMainPage.module.css";
import AdminTopBar from "../../../components/AdminTopBar/AdminTopBar";
import {api} from "../../../api"
import AdminCard from "../../../components/AdminCard/AdminCard";

export default function AdminMainPage() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    /**
     * GET method to get courses according to current logged in instructor 
     */
    async function fetchInstructors() {
      try {
        const res = await api.get("/api/admin/instructors/");

        console.log("Instructors:", res.data)
        if (!cancelled) {
          setInstructors(res.data);
          setLoading(false);
          // Instructor has at least one course — go to the list view
          // navigate("/instructor/course-list", { replace: true });
        }
        // else: stay on this page and show "No courses yet"
      } catch (err) {
        // Silently fail and keep user here; you can log if you want
        console.error("Failed to check instructors", err);
      }
    }
    fetchInstructors();
    return () => {
      cancelled = true;
    };
  }, []); 

  const handleViewInstructor = (instructorId) => {
    navigate(`/admin/instructor/${instructorId}`);
  };

  const handleToggleStatus = async (instructorId, currentStatus) => {
    try {
      await api.patch(`/api/admin/instructors/${instructorId}/`, {
        is_active: !currentStatus
      });
      // Refresh the list
      const res = await api.get("/api/admin/instructors/");
      setInstructors(res.data);
    } catch (err) {
      console.error("Failed to update instructor status", err);
      alert("Failed to update instructor status");
    }
  };

  if (loading) {
    return (
      <div className={i.wrap}>
        <AdminTopBar />
        <div className={i.loading}>Loading instructors...</div>
      </div>
    );
  }

  return (
    <>
    <AdminTopBar />
    <div className={i.wrap}>
      <header className={i.header}>
        <h1 className={i.title}>CREATE INSTRUCTOR</h1>
        {instructors.length > 0 && (
    <Button
      variant="green"
      className={i.enrollBtn}
      onClick={() => navigate("/admin/create-instructor")}
    >
      <span>Create Instructor</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </Button>
        )}
      </header>

  {instructors.length === 0 ? (
    <section className={i.card}>
    <p className={i.emptyText}>
      No instructors created yet. 
      <br />
      Create an instructor to get started.
    </p>
    <div className={i.ctaRow}>
      <Button
      variant="green"
      className={i.enrollBtn}
      onClick={() => navigate("/admin/create-instructor")}
    >
      <span>Create Instructor</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </Button>
    </div>
    </section>
  ) : (
    <section className={i.grid}>
      {instructors.map((instructor) => (
        <AdminCard
          key={instructor.instructor_profile_id}
          instructor={{
            title: instructor.title,
            name: instructor.full_name,
            email: instructor.email,
            password: instructor.password || "N/A",
            account_status: instructor.is_active ? "Active" : "Inactive",
          }}
          ctaText="View"
          onClick={() =>
            handleViewInstructor(instructor.instructor_profile_id)
          }
        />
      ))}
    </section>
  )}
    </div>
    </>
  );
}
