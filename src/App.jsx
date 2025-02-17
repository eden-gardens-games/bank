import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
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
  const [isAuthChecked, setIsAuthChecked] = useState(false); // Track initial auth check
  const navigate = useNavigate();

  // Run this only once when the app loads (not on every navigation)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthChecked(true); // Mark authentication check as done

      if (user) {
        // Retrieve last visited page from sessionStorage
        const lastPage = sessionStorage.getItem("lastPage");

        if (lastPage) {
          navigate(lastPage);
        } else {
          navigate(user.email === "admin@wiseman.com" ? "/bankAdmin" : "/bankDashboard");
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save the last visited page whenever the user navigates
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("lastPage", window.location.pathname);
    }
  }, [window.location.pathname, user]);

  if (!isAuthChecked) {
    return <div>Loading...</div>; // Prevent rendering routes until auth check is complete
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
