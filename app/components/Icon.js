// Line icons on a 20px grid, 1.75 stroke, drawn with currentColor (LeadDesk style).
const PATHS = {
  dashboard: "M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z",
  users: "M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5M13 3.3a3 3 0 0 1 0 5.4M15 12.3c1.8.6 3 2.3 3 4.7",
  user: "M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 17.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5",
  pipeline: "M3 4h14M5 10h10M8 16h4",
  "check-circle": "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM6.8 10.2l2.2 2.2 4.2-4.6",
  shield: "M10 2.5l6 2.5v4.5c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V5z",
  plus: "M10 4v12M4 10h12",
  search: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM13.5 13.5L17 17",
  mail: "M3 5h14v10H3zM3 5.5l7 5.5 7-5.5",
  phone: "M6.5 3H4.2C3.5 3 3 3.5 3 4.2 3 11.3 8.7 17 15.8 17c.7 0 1.2-.5 1.2-1.2v-2.3l-3.5-1.5-1.7 1.7c-2-1-3.5-2.5-4.5-4.5L9 7.5z",
  building: "M4 17V3h8v14M12 8h4v9M2 17h16M7 6h2M7 9h2M7 12h2",
  briefcase: "M3 7h14v9H3zM7 7V4.5h6V7M3 11h14",
  tag: "M3 3h7l7 7-7 7-7-7zM7 7h.01",
  calendar: "M3 5h14v12H3zM3 9h14M7 3v4M13 3v4",
  trophy: "M6 3h8v5a4 4 0 0 1-8 0zM6 5H3v1a3 3 0 0 0 3 3M14 5h3v1a3 3 0 0 1-3 3M10 12v3M7 17h6",
  logout: "M8 17H4V3h4M13 14l4-4-4-4M17 10H8",
  edit: "M13.5 3.5l3 3L7 16H4v-3z",
  trash: "M3.5 5.5h13M8 5.5V3.5h4v2M5 5.5l1 11h8l1-11",
  download: "M10 3v10M6 9l4 4 4-4M3 17h14",
  lock: "M5 9h10v8H5zM7 9V6a3 3 0 0 1 6 0v3",
  note: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h3",
  "chevron-left": "M12.5 4.5L7 10l5.5 5.5",
  "chevron-right": "M7.5 4.5L13 10l-7.5 5.5",
  x: "M5 5l10 10M15 5L5 15",
  check: "M4.5 10.5l3.5 3.5 7.5-8",
  inbox: "M3 11l2-7h10l2 7v5H3zM3 11h4l1 2h4l1-2h4",
  clock: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM10 6v4l2.5 2",
};

export default function Icon({ name, size = 16, label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label}
      role={label ? "img" : undefined} style={{ flexShrink: 0 }}>
      <path d={PATHS[name] || ""} />
    </svg>
  );
}
