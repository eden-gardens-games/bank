import Auth from "./components/Auth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
export default App;
