import "./globals.css";

export const metadata = { title: "Simple CRM" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
