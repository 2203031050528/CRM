"use client";
import { createContext, useContext } from "react";

const UserContext = createContext(null);
export const UserProvider = ({ user, children }) => <UserContext.Provider value={user}>{children}</UserContext.Provider>;
export const useUser = () => useContext(UserContext);
