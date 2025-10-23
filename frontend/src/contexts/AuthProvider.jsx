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
        console.log('AuthProvider - Token payload:', payload);
        console.log('AuthProvider - Role from token:', payload.role);
        console.log('AuthProvider - User from token:', payload.user);
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
    console.log('AuthProvider - Login called with token:', newToken);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    const payload = JSON.parse(atob(newToken.split(".")[1]));
    console.log('AuthProvider - Login payload:', payload);
    console.log('AuthProvider - Setting role:', payload.role);
    console.log('AuthProvider - Setting user:', payload.user);
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
