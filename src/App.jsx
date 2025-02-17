import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

const auth = getAuth();

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check the authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Set user state to reflect auth state

      if (user) {
        if (user.email === "admin@wiseman.com") {
          navigate("/bankAdmin"); // Redirect to Admin Page if admin
        } else {
          navigate("/bankDashboard"); // Redirect to User Dashboard
        }
      } else {
        navigate("/"); // Redirect to Login page if user is not authenticated
      }
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, [navigate]);
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