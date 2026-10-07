"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useUser } from "./UserContext";

// Loads contacts (for linking) and, for admins, users (for the owner picker).
export function useOptions({ contacts: wantContacts = true } = {}) {
  const user = useUser();
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (wantContacts) api("/api/contacts").then(setContacts).catch(() => {});
    if (user.role === "admin") api("/api/users").then((u) => setUsers(u.filter((x) => x.active))).catch(() => {});
  }, [user.role, wantContacts]);
  return { contacts, users };
}
