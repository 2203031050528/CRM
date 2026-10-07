export default function Avatar({ name = "", size = 32 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span className="avatar" aria-hidden="true" style={{ width: size, height: size, fontSize: size >= 48 ? 18 : size <= 28 ? 11 : 12 }}>
      {initials || "?"}
    </span>
  );
}
