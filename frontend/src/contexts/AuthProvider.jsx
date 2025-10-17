import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      // Decode token to get role (simple decode, no validation for now)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
        setUser(payload.user || null);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    const payload = JSON.parse(atob(newToken.split(".")[1]));
    setRole(payload.role);
    setUser(payload.user || null);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, role, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
