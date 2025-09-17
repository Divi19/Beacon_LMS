import axios from "axios";

const baseURL = "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL }); //creating an axios client 

//https://axios-http.com/docs/interceptors
//Before every request 
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access"); //Looking for saved JWT tokens
  if (access) config.headers.Authorization = `Bearer ${access}`; //Found, sets the current session to the user logged in 
  return config; //Continue sending that request
});

//Refresh expired tokens - before every response
api.interceptors.response.use(
  (r) => r, //return response if succeeds 
  async (error) => {
    const original = error.config; //grab the original request 
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh"); //grab refresh token
      if (!refresh) throw error;
      //post the refreshed token 
      const { data } = await axios.post(`${baseURL}/token/refresh/`, { refresh });
      localStorage.setItem("access", data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return axios(original); //retry request 
    }
    throw error;
  }
);

export default api;