import s from "./InstructorCourseCard.module.css";

export default function InstructorCourseCard({
  course,
  onClick,
  ctaText = "Enrol",
  onCta,
  isEnrolled = false,
}) {

    const raw =
              course.status ??
              course.course_status ??
              course.is_active ??
              course.active;

            const statusText =
              typeof raw === "boolean"
                ? raw
                  ? "Active"
                  : "Inactive"
                : raw
                ? String(raw)
                : "—";

                
  return (
    <article
      className={s.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <div className={s.body}>
        <h2 className={s.title}>{course.course_title}{" "}
                {"["}{statusText}{"]"}</h2>
        <div className={s.metaRow}>
          <span>
            Code: <strong>{course.course_id}</strong>
          </span>
          <span>{course.course_credits} Credits</span>
        </div>
        <div className={s.metaRow}>
          <span>
            Course Director: <strong>{course.course_director}</strong>
          </span>
        </div>
      </div>

      <div className={s.footer}>
        <button
          className={s.cta}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {ctaText}
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
        </button>
      </div>
    </article>
  );
}
