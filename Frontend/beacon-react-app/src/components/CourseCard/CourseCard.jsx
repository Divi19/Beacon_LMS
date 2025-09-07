import s from "./CourseCard.module.css";

export default function CourseCard({
  course,
  onClick,
  ctaText = "Enrol",
  onCta,
}) {
  return (
    <article
      className={s.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <div className={s.body}>
        <h3 className={s.title}>{course.title}</h3>
        <div className={s.metaRow}>
          <span>
            Code: <strong>{course.code}</strong>
          </span>
          <span>{course.credits} Credits</span>
        </div>
        <div className={s.metaRow}>
          <span>
            Course Director: <strong>{course.director}</strong>
          </span>
        </div>
      </div>

      <div className={s.footer}>
        <button
          className={s.cta}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCta?.();
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
