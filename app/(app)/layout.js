import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { UserProvider } from "@/app/components/UserContext";
import Sidebar from "@/app/components/Sidebar";

export default async function AppLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/api/auth/logout");
  const { id, name, email, role } = user;
  return (
    <UserProvider user={{ id, name, email, role }}>
      <div className="shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </UserProvider>
  );
}
