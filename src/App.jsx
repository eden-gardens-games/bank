import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "./firebase"; // Ensure you import auth from Firebase config
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
    document.body.className = "";
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false once the auth state is checked

      if (user) {
        // Check if there was a page stored in sessionStorage
        const returnUrl = sessionStorage.getItem("returnUrl");
        
        if (returnUrl) {
          // Navigate back to the page the user was on before
          sessionStorage.removeItem("returnUrl"); // Clean up session storage
          navigate(returnUrl);
        } else {
          // Default behavior: Redirect to user-specific page (either Admin or User)
          if (user.email === "admin@wiseman.com") {
            navigate("/bankAdmin");
          } else {
            navigate("/bankDashboard");
          }
        }
      } else {
        // If user is not authenticated, redirect to login page
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Before redirecting, store the current URL in sessionStorage
    if (user === null && location.pathname !== "/") {
      sessionStorage.setItem("returnUrl", location.pathname);
    }
  }, [location, user]);

  if (loading) {
    return <div>Loading...</div>; // Display loading state while checking auth
  }

  return (
    <div>
      <BodyClassManager />
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
    </div>
  );
}

export default App;
