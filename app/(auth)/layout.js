export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <div className="auth-side">
        <h1>Manage every customer relationship in one place.</h1>
        <p>Track contacts, move deals through your pipeline and never miss a follow-up.</p>
        <ul>
          <li>✓ Contacts with notes and history</li>
          <li>✓ Drag-and-drop sales pipeline</li>
          <li>✓ Tasks with due dates and priorities</li>
          <li>✓ Admin control over users and data</li>
        </ul>
      </div>
      <div className="auth-main">{children}</div>
    </div>
  );
}
