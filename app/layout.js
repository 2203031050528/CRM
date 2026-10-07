import "./globals.css";

export const metadata = { title: "Simple CRM", description: "Manage contacts, deals and tasks" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
