import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { EnrollmentProvider } from "./state/EnrollmentContext";


const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <EnrollmentProvider>
        <App />
      </EnrollmentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
