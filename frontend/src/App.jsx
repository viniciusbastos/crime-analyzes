import React from "react";
import CrimeDashboard from "./components/CrimeDashboard";
import Login from "./components/Login";
import { ThemeProvider } from "./components/ThemeContext";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <CrimeDashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
