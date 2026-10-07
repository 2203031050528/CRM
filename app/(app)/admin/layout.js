import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  if (user?.role !== "admin") redirect("/");
  return children;
}
