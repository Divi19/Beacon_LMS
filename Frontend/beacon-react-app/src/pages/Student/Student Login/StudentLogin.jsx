import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./StudentLogin.module.css";
import { api } from "../../../api";

// Optional: pass a logo URL via props if you prefer
// Usage: <StudentLogin logoSrc="/assets/beacon-logo.png" />
export default function StudentLogin({ logoSrc }) {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const [isLoading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data } = await api.post("/student/login/", formData);
      console.log("Login response:", data);
      // Backend returns: { access, refresh, user: {...} }
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      localStorage.setItem("studentId", data.user.student_profile_id);
      localStorage.setItem("role", "student");
      document.documentElement.setAttribute("data-role", "student");
      setSuccessMessage("Login successful");
      navigate("/student/my-courses", { replace: true });
    } catch (err) {
      // Robust error extraction
      if (err.response && err.response.data) {
        const payload = err.response.data;
        // DRF ValidationError often uses {field: [msgs]} or {"detail": "..."} or your {"error": "..."}
        if (payload.detail) setError(payload.detail);
        else if (payload.error) setError(payload.error);
        else if (typeof payload === "string") setError(payload);
        else {
          // field-wise
          Object.keys(payload).some((field) => {
            const msgs = payload[field];
            if (Array.isArray(msgs) && msgs.length) {
              setError(String(msgs[0]));
              return true;
            }
            if (typeof msgs === "string") {
              setError(msgs);
              return true;
            }
            return false;
          });
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <section
        className={styles.card}
        role="region"
        aria-label="Student Sign In"
      >
        <img src="/logo.svg" alt="Beacon logo" className={styles.logo} />

        <h1 className={styles.title}>Sign In - Student</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label htmlFor="email" className={styles.label}>
            Student Email:
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={styles.input}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            aria-required="true"
          />

          <label htmlFor="password" className={styles.label}>
            Password:
          </label>
          <div className={styles.pwRow}>
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.buttonRow}>
            <Link to="/student/signup" className={styles.ctaAlt}>
              <span className={styles.ctaTextUnderline}>Sign Up</span>
            </Link>

            <button className={styles.cta} type="submit" disabled={isLoading}>
              {isLoading ? (
                "Logging In…"
              ) : (
                <span className={styles.ctaTextUnderline}>Log In</span>
              )}
            </button>
          </div>
          {/* <button className={styles.cta} type="submit" disabled={isLoading}>
            {isLoading ? "Logging In…" : <span className={styles.ctaTextUnderline}>Log In</span>}
          </button> */}
        </form>

        {/* Optional small print / links area */}
        <div className={styles.footerLinks}>
          <Link to="/" className={styles.backLink}>
            Back to entry
          </Link>
        </div>
      </section>
    </main>
  );
}
