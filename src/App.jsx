import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/bankAdmin" element={<AdminPage />} />
        <Route path="/bankDashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
