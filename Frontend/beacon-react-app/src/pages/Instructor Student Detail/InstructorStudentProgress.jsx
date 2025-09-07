import React, { useState } from "react";
import i from "./InstructorStudentProgress.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";

export default function InstructorStudentProgress() {
    
    const navigate = useNavigate();

    const handleClick = () => {
    navigate("/student-progress-1"); 
  };

  return (
    <div className={i.wrap}>
      <InstructorTopBar />
      <header className={i.header}>
        <div className={i.left}>
        <h1 className={i.title}>STUDENT PROGRESS</h1>
        </div>
      </header>
    <div className={i.container}>
  <div className={i.card} onClick={handleClick} role="button" tabIndex={0}>
    <h2 className={i.cardTitle}>Bachelor of Computer Science Advanced</h2>
    <div className={i.cardDesc1}>
  <div className={i.leftGroup}>
    <span>Code:</span>
    <span className={i.spacing}>C2100</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={i.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Charles Xavier</span>
</div>
<br />
<span>5 students</span>
  </div>

  <div className={i.card}>
    <h2 className={i.cardTitle}>Bachelor  of Computer Science Data Science</h2>
    <div className={i.cardDesc1}>
  <div className={i.leftGroup}>
    <span>Code:</span>
    <span className={i.spacing}>C2102</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={i.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Charles Xavier</span>
</div>
<br />
<span>0 students</span>
  </div>

  <div className={i.card}>
    <h2 className={i.cardTitle}>Diploma in Discrete Mathematics</h2>
    <div className={i.cardDesc1}>
  <div className={i.leftGroup}>
    <span>Code:</span>
    <span className={i.spacing}>C1003</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={i.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Allison Swift</span>
</div>
<br />
<span>0 students</span>
  </div>

  <div className={i.card}>
    <h2 className={i.cardTitle}>Diploma in Digital Marketing</h2>
    <div className={i.cardDesc1}>
  <div className={i.leftGroup}>
    <span>Code:</span>
    <span className={i.spacing}>C3109</span>
  </div>
  <span>20 Credits</span>
</div>
  <div className={i.cardDesc2}>
  <span>Course Director:</span>
  <span>Dr Benjamin Button</span>
</div>
<br />
<span>2 students</span>
  </div>
</div>
    </div>
  );
}