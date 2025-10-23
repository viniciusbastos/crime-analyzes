import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

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
        console.log("AuthProvider - Token payload:", payload);
        console.log("AuthProvider - Role from token:", payload.role);
        setRole(payload.role);
        setIsAuthenticated(true);

        // Set Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Fetch user details from backend
        const fetchUserProfile = async () => {
          try {
            console.log("AuthProvider - Fetching user profile on init...");
            const response = await axios.get('/auth/profile');
            console.log("AuthProvider - User profile response:", response.data);
            setUser(response.data.user);
            console.log("AuthProvider - User set to:", response.data.user);
          } catch (error) {
            console.error("AuthProvider - Failed to fetch user profile on init:", error);
            // Still allow authentication even if profile fetch fails
            setUser(null);
          }
        };

        fetchUserProfile();
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
  }, [token]);

  const login = async (newToken) => {
    console.log("AuthProvider - Login called with token:", newToken);
    setToken(newToken);
    localStorage.setItem("token", newToken);

    // Set Authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    const payload = JSON.parse(atob(newToken.split(".")[1]));
    console.log("AuthProvider - Login payload:", payload);
    console.log("AuthProvider - Setting role:", payload.role);
    setRole(payload.role);
    setIsAuthenticated(true);

    // Fetch user details from backend
    try {
      console.log("AuthProvider - Fetching user profile...");
      const response = await axios.get('/auth/profile');
      console.log("AuthProvider - User profile response:", response.data);
      setUser(response.data.user);
      console.log("AuthProvider - User set to:", response.data.user);
    } catch (error) {
      console.error("AuthProvider - Failed to fetch user profile:", error);
      // Still allow login even if profile fetch fails
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    // Clear Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, role, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
