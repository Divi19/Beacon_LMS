import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./AdminCreateInstructor.module.css";
import {api} from "../../../api" 

// Optional: pass a logo URL via props if you prefer
// Usage: <StudentLogin logoSrc="/assets/beacon-logo.png" />
export default function AdminCreateInstructor() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    email: "",
    full_name: "",
    // last_name: "",
    password: "",
  })
  const handleChange = (e) => {
    setFormData(
      {...formData, 
        [e.target.name]: e.target.value
      }
    )
  }
  const [isLoading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null) 
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data } = await api.post("/api/admin/instructors/", formData);

      setSuccessMessage("Instructor created successfully!");
      
      // Redirect to main page after 1.5 seconds
      setTimeout(() => {
        navigate("/admin/main-page", { replace: true });
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data) {
        const payload = err.response.data;
        if (payload.detail) setError(payload.detail);
        else if (payload.error) setError(payload.error);
        else if (typeof payload === "string") setError(payload);
        else {
          // Field-wise errors
          const firstError = Object.values(payload).find(v => 
            Array.isArray(v) ? v.length > 0 : !!v
          );
          setError(Array.isArray(firstError) ? firstError[0] : firstError || "Validation error");
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
      <section className={styles.card} role="region" aria-label="Student Sign In">
       <img src="/logo.svg" alt="Beacon logo" className={styles.logo} />    

        <h1 className={styles.title}>Instructor Account Creation</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="title" className={styles.label}>
            Instructor Title:
          </label>
          <input
            id="title"
            name="title"
            type="title"
            inputMode="title"
            autoComplete="title"
            className={styles.input}
            // placeholder="you@example.com"
            value={formData.title}
            onChange={handleChange}
            required
            aria-required="true"
          />
          <label htmlFor="email" className={styles.label}>
            Instructor Email:
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={styles.input}
            // placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            aria-required="true"
          />

          <label htmlFor="full_name" className={styles.label}>
            Full Name: 
          </label>
          <input
            id="full_name"
            name="full_name"
            type="full_name"
            inputMode="full_name"
            autoComplete="full_name"
            className={styles.input}
            // placeholder="you@example.com"
            value={formData.full_name}
            onChange={handleChange}
            required
            aria-required="true"
          />

          {/* <label htmlFor="last_name" className={styles.label}>
            Last name:
          </label>
          <input
            id="last_name"
            name="last_name"
            type="last_name"
            inputMode="last_name"
            autoComplete="last_name"
            className={styles.input}
            // placeholder="you@example.com"
            value={formData.last_name}
            onChange={handleChange}
            required
            aria-required="true"
          /> */}

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
            //   placeholder="••••••••"
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

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.buttonRow}>
            {/* <Link to="/student/signup" className={styles.ctaAlt}>
              <span className={styles.ctaTextUnderline}>Sign Up</span>
            </Link> */}
          <button className={styles.cta} type="submit" disabled={isLoading}>
            {isLoading ? "Signing Up…" : <span className={styles.ctaTextUnderline}>Create</span>}
          </button>

            {/* <button className={styles.cta} type="submit" disabled={isLoading}>
            {isLoading ? "Logging In…" : <span className={styles.ctaTextUnderline}>Log In</span>}
          </button> */}
          </div>
          {/* <button className={styles.cta} type="submit" disabled={isLoading}>
            {isLoading ? "Logging In…" : <span className={styles.ctaTextUnderline}>Log In</span>}
          </button> */}
        </form>

        {/* Optional small print / links area */}
        <div className={styles.footerLinks}>
          <Link to="/admin/main-page" className={styles.backLink}>Back to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
