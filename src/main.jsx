import './index.css'
import React from "react";
import ReactDOM from "react-dom/client"; // Use react-dom/client for React 18 and above
import { HashRouter as Router } from "react-router-dom";
import App from "./App";

const rootElement = document.getElementById("root");

// React 18+ usage
const root = ReactDOM.createRoot(rootElement);  // Create root using createRoot
root.render(
  <Router>
    <App />
  </Router>
);
