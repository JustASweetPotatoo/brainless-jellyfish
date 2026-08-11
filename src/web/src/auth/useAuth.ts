import { useContext } from "react";
import { UserContext } from "./UserContext";

export function useAuth() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useAuth must be used inside UserProvider");
  }

  return context;
}
