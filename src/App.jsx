import Auth from "./components/Auth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/bank" element={<Auth />} />
        <Route path="/bankAdmin" element={<AdminPage />} />
        <Route path="/bankDashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
export default App;
