import s from "./LessonDisplay.module.css";

export default function LessonDisplay({
  lesson,
  onClick,
  ctaText = "Enrol",
  onCta,
  isEnrolled = false,
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
        <h3 className={s.title}>{lesson.title}</h3>
        <div className={s.metaRow}>
          <span>
            Code: <strong>{lesson.code}</strong>
          </span>
          <span>{lesson.credit} Credits</span>
        </div>
        <div className={s.metaRow}>
          <span>
            Course Director: <strong>{lesson.director}</strong>
          </span>
        </div>
        <div className={s.metaRow}>
          <span>Duration: <strong>{lesson.duration}</strong> Weeks</span>
          </div>
          {isEnrolled}
      </div>
    </article>
  );
}
