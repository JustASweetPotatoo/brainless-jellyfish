import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"));

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("accessToken", newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("accessToken");
  };

  return <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext)!;
