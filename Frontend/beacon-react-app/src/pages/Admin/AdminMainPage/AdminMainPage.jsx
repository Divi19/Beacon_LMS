import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./AdminMainPage.module.css";
import AdminTopBar from "../../../components/AdminTopBar/AdminTopBar";
import {api} from "../../../api" 
export default function AdminMainPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    /**
     * GET method to get courses according to current logged in instructor 
     */
    async function checkCourses() {
      try {
        const res = await api.get("/instructor/courses/");
        if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
          // Instructor has at least one course — go to the list view
          navigate("/instructor/course-list", { replace: true });
        }
        // else: stay on this page and show "No courses yet"
      } catch (err) {
        // Silently fail and keep user here; you can log if you want
        console.error("Failed to check courses", err);
      }
    }
    checkCourses();
    return () => {
      cancelled = true;
    };
  }, [navigate]); 

  return (
    <div className={i.wrap}>
      <AdminTopBar />

      <header className={i.header}>
        <h1 className={i.title}>CREATE INSTRUCTOR</h1>
      </header>

      <section className={i.card}>
        <p className={i.emptyText}>
          No created instructor yet. Go to instructor creation to create an instructor.
          <br />
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
                    <polyline points="12 8 16 12 12 16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
          </Button>
        </div>
      </section>
    </div>
  );
}
