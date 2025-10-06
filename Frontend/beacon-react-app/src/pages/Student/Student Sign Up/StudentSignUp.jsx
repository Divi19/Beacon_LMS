import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./StudentSignUp.module.css";
import { api } from "../../../api";

// Optional: pass a logo URL via props if you prefer
// Usage: <StudentLogin logoSrc="/assets/beacon-logo.png" />
export default function StudentSignUp({ logoSrc }) {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
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

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    setSuccessMessage(null);

    try {
      const { data } = await api.post("/student/signup/", formData);

      // Backend returns: { access, refresh, user: {...} }
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      setSuccessMessage("Sign up successful");
      navigate("/student/login", { replace: true });
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

        <h1 className={styles.title}>Sign Up - New Student</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label htmlFor="title" className={styles.label}>
            Student Title:
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
            Student Email:
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

          <label htmlFor="first_name" className={styles.label}>
            First Name:
          </label>
          <input
            id="first_name"
            name="first_name"
            type="first_name"
            inputMode="first_name"
            autoComplete="first_name"
            className={styles.input}
            // placeholder="you@example.com"
            value={formData.first_name}
            onChange={handleChange}
            required
            aria-required="true"
          />

          <label htmlFor="last_name" className={styles.label}>
            Last Name:
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
          />

          <div className={styles.pwGrid}>
            <div>
              <label htmlFor="password" className={styles.label}>
                Password:
              </label>
              <div className={styles.pwRow}>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  minLength={6}
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
            </div>

            <div>
              <label htmlFor="confirm_password" className={styles.label}>
                Confirm password:
              </label>
              <div className={styles.pwRow}>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPw2 ? "text" : "password"}
                  autoComplete="new-password"
                  className={styles.input}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPw2((s) => !s)}
                  aria-label={
                    showPw2 ? "Hide confirm password" : "Show confirm password"
                  }
                >
                  {showPw2 ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.buttonRow}>
            {/* <Link to="/student/signup" className={styles.ctaAlt}>
              <span className={styles.ctaTextUnderline}>Sign Up</span>
            </Link> */}
            <button className={styles.cta} type="submit" disabled={isLoading}>
              {isLoading ? (
                "Signing Up…"
              ) : (
                <span className={styles.ctaTextUnderline}>Sign Up</span>
              )}
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
          <Link to="/" className={styles.backLink}>
            Back to entry
          </Link>
        </div>
      </section>
    </main>
  );
}
