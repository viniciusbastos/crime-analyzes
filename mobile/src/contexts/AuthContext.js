import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_CONFIG } from "../constants/config";

// Constants for SecureStore keys
const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
};

// Configure axios base URL for backend connection
axios.defaults.baseURL = API_CONFIG.BASE_URL.replace("/api", "");

const AuthContext = createContext();

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context containing user state and auth methods
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Authentication provider component that manages user authentication state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} AuthContext provider with authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate token by making a test request to a protected endpoint
  const validateToken = useCallback(async (token) => {
    try {
      console.log("Validating token with server");
      await axios.get("/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Token validation successful");
      return true;
    } catch (error) {
      console.error(
        "Token validation failed:",
        error.response?.status || error.message
      );
      return false;
    }
  }, []);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const initializeAuth = useCallback(async () => {
    try {
      console.log(
        "Initializing auth: Attempting to retrieve stored token and user data"
      );
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      console.log("SecureStore retrieval result:", {
        hasToken: !!token,
        hasUserData: !!userData,
      });

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log("Parsed user data:", parsedUser);

        // Validate token with server
        const isValid = await validateToken(token);
        if (isValid) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          // Set default authorization header
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log(
            "Auth initialized successfully with valid stored credentials"
          );
        } else {
          console.log("Stored token invalid, clearing credentials");
          // Clear invalid credentials
          await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
        }
      } else {
        console.log("No stored credentials found, user not authenticated");
      }
    } catch (error) {
      console.error("Error initializing auth - SecureStore failure:", error);
      // Reset auth state on SecureStore failure
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  }, [validateToken]);

  /**
   * Authenticate user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {boolean} [rememberMe=false] - Whether to persist login state
   * @returns {Promise<Object>} Result object with success status and optional error
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
        rememberMe,
      });

      const { token, user: userData } = response.data;

      // Store token securely
      console.log("Storing auth credentials in SecureStore");
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER,
        JSON.stringify(userData)
      );
      console.log("Auth credentials stored successfully");

      // Set user state
      setUser(userData);
      setIsAuthenticated(true);

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        errorMessage = "Network error: Unable to connect to server. Check your internet connection and server status.";
      } else {
        // Other error
        errorMessage = error.message || "An unexpected error occurred";
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Register a new user account
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {string} name - User display name
   * @returns {Promise<Object>} Result object with success status and optional error/message
   */
  const register = async (email, password, name) => {
    try {
      const response = await axios.post("/auth/register", {
        email,
        password,
        name,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  /**
   * Initiate password reset process for user
   * @param {string} email - User email address
   * @returns {Promise<Object>} Result object with success status and optional error/message
   */
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post("/auth/forgot-password", {
        email,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to process request",
      };
    }
  };

  /**
   * Log out the current user and clear all authentication state
   * @returns {Promise<Object>} Result object with success status and optional error
   */
  const logout = async () => {
    try {
      console.log("Logging out: Clearing stored auth credentials");
      // Clear stored data
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      console.log("Auth credentials cleared from SecureStore");

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);

      // Remove authorization header
      delete axios.defaults.headers.common["Authorization"];

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "Logout failed",
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    forgotPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
