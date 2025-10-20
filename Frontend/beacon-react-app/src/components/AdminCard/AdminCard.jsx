import s from "./AdminCard.module.css";

export default function AdminCard({
  instructor,
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
        <h3 className={s.title}>{instructor.title}{instructor.title && !instructor.title.includes('.') ? '.' : ''}&nbsp; {instructor.name}</h3>
        <div className={s.metaRow}>
          <span>
            Email: <strong>{instructor.email}</strong>
          </span>
        </div>
        <div className={s.metaRow}>
          <span>
            Email password: <strong>{instructor.password}</strong>
          </span>
        </div>
        <div className={s.metaRow}>
          <span>Account status: <strong>{instructor.account_status}</strong></span>
          </div>
          {isEnrolled}
      </div>
    </article>
  );
}
