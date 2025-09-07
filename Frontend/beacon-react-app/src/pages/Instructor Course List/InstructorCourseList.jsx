import React, { useState } from "react";
import s from "./InstructorCourseList.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";

export default function InstructorCourseList() {
    const navigate = useNavigate();

  return (
    <div className={s.wrap}>
      <InstructorTopBar />
      <header className={s.header}>
        <div className={s.left}>
        <h1 className={s.title}>COURSE</h1>
        </div>
        <div className={s.right}>
          <Button
            variant="orange"
            className={s.enrollBtn}
            onClick={() => navigate("/instructor/course-create")}
          >
            <span>Create Course</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22" height="22" viewBox="0 0 24 24" fill="#6ac3d1ff"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={s.arrow}
            >
              <circle cx="12" cy="12" r="10" fill="#278d9cff" />
              <line x1="12" y1="6" x2="12" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"></line>
              <line x1="6" y1="12" x2="18" y2="12"></line>
            </svg>
          </Button>
        </div>
      </header>
    <div className={s.container}>
  <div className={s.card}>
    <h2 className={s.cardTitle}>Bachelor of Computer Science Advanced</h2>
    <div className={s.cardDesc1}>
  <div className={s.leftGroup}>
    <span>Code:</span>
    <span className={s.spacing}>C2100</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={s.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Charles Xavier</span>
</div>
  </div>

  <div className={s.card}>
    <h2 className={s.cardTitle}>Bachelor  of Computer Science Data Science</h2>
    <div className={s.cardDesc1}>
  <div className={s.leftGroup}>
    <span>Code:</span>
    <span className={s.spacing}>C2102</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={s.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Charles Xavier</span>
</div>
  </div>

  <div className={s.card}>
    <h2 className={s.cardTitle}>Diploma in Discrete Mathematics</h2>
    <div className={s.cardDesc1}>
  <div className={s.leftGroup}>
    <span>Code:</span>
    <span className={s.spacing}>C1003</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={s.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Allison Swift</span>
</div>
  </div>

  <div className={s.card}>
    <h2 className={s.cardTitle}>Diploma in Digital Marketing</h2>
    <div className={s.cardDesc1}>
  <div className={s.leftGroup}>
    <span>Code:</span>
    <span className={s.spacing}>C3109</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={s.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Benjamin Button</span>
</div>
  </div>
</div>
    </div>
  );
}