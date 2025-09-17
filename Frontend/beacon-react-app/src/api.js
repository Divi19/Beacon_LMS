import axios from "axios";
export const api = axios.create({ baseURL: "http://localhost:8000" });

//For logout 
/**
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("accessToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
 */

//Login only 

api.interceptors.request.use((cfg) => {
    const url = (cfg.url || "").toString();
    const isAuthFree = url.includes("/instructor/login/") || url.includes("/api/token/");
    //skips attaching header if path is as above
    if (!isAuthFree) {
      const t = localStorage.getItem("accessToken");
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
    }
    return cfg;
  });
