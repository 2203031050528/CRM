import Icon from "./Icon";

// White container with an optional header; `raw` lets lists and tables run edge to edge.
export default function Card({ title, subtitle, actions, raw, children, footer, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {actions}
        </div>
      )}
      {raw ? <div className="card-raw">{children}</div> : <div className="card-body">{children}</div>}
      {footer && <div className="card-foot">{footer}</div>}
    </section>
  );
}

export function Empty({ icon = "inbox", title, children, action }) {
  return (
    <div className="empty">
      <span className="circle"><Icon name={icon} size={20} /></span>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
