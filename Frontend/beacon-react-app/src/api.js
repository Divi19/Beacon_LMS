import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

// For logout (optional)
/**
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("accessToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
*/

// Login only
api.interceptors.request.use((cfg) => {
  const url = (cfg.url || "").toString();

  // Paths that don't require auth
  const isAuthFree = url.includes("/instructor/login/") 
    || url.includes("/api/token/") 
    || url.includes("/student/login/");

  // Attach token if not auth-free
  if (!isAuthFree) {
    const t = localStorage.getItem("accessToken");
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }

  return cfg;
});
