// ============================================================
// A titled group of tasks ("Overdue", "Today", "Tomorrow"…)
// ============================================================

export default function TaskSection({ title, count, tone, action, children }) {
  return (
    <section className={`task-section${tone ? ` ${tone}` : ''}`}>
      <div className="section-head">
        <h2 className="section-title">
          {title} {count !== undefined && <span className="section-count">({count})</span>}
        </h2>
        {action}
      </div>
      <ul className="task-list">{children}</ul>
    </section>
  );
}
