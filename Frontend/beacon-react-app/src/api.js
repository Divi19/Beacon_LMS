import axios from "axios";

// Change baseURL to your deployed backend URL
export const api = axios.create({ 
  baseURL: "https://ma-thursday2pm-team1-2-1.onrender.com" 
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
