import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Auth from "./components/Auth";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";
import AdminUpdate from "./components/AdminUpdate";
import AdminAddLoan from "./components/AdminAddLoan";
import AdminProfile from "./components/AdminProfile";
import AdminPayments from "./components/AdminPayments";
import CustomerProfile from "./components/CustomerProfile";

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
		<Route path="/adminUpdate" element={<AdminUpdate />} />
		<Route path="/adminAddLoan" element={<AdminAddLoan />} />
		<Route path="/adminProfile" element={<AdminProfile />} />
		<Route path="/adminPayments" element={<AdminPayments />} />
		<Route path="/custProfile" element={<CustomerProfile />} />
		
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
