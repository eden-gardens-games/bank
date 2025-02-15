import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Auth from "./components/Auth";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";

function BodyClassManager() {
  const location = useLocation();

  useEffect(() => {
    // Reset body class
    document.body.className = "";
    
    // Assign different classes based on the route
    if (location.pathname === "/") {
      document.body.classList.add("auth-page");
    } else if (location.pathname === "/bankAdmin") {
      document.body.classList.add("admin-page");
    } else if (location.pathname === "/bankDashboard") {
      document.body.classList.add("dashboard-page");
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <BodyClassManager /> {/* Dynamically updates body class */}
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/bankAdmin" element={<AdminPage />} />
        <Route path="/bankDashboard" element={<Dashboard />} />
		<Route path="/bankAdminUpdate" element={<AdminUpdate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
