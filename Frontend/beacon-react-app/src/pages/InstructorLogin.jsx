import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./InstructorLogin.module.css";

// Optional: pass a logo URL via props if you prefer
// Usage: <InstructorLogin logoSrc="/assets/beacon-logo.png" />
export default function InstructorLogin({ logoSrc }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Placeholder for future backend call
  // Swap this with a real API request when ready
  async function fakeLoginRequest({ email, password }) {
    // Simulate API latency & response shape you can later keep
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) resolve({ ok: true, token: "fake.jwt.token" });
        else reject(new Error("Invalid credentials"));
      }, 700);
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      // Replace with real request, e.g.:
      // const res = await loginInstructor(email, password)
      const res = await fakeLoginRequest({ email, password });
      if (res?.ok) {
        // Persist token later if needed, e.g., localStorage.setItem("token", res.token)
        navigate("/instructor/course-list", { replace: true });
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <section className={styles.card} role="region" aria-label="Instructor Sign In">
       <img src="/logo.svg" alt="Beacon logo" className={styles.logo} />    

        <h1 className={styles.title}>Sign In - Instructor</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button className={styles.cta} type="submit" disabled={submitting}>
            {submitting ? "Logging In…" : <span className={styles.ctaTextUnderline}>Log In</span>}
          </button>
        </form>

        {/* Optional small print / links area */}
        <div className={styles.footerLinks}>
          <Link to="/" className={styles.backLink}>Back to entry</Link>
        </div>
      </section>
    </main>
  );
}
