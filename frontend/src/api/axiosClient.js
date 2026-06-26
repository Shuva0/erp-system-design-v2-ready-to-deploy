import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
});

// Attach the JWT to every outgoing request automatically, read from localStorage.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token expires/becomes invalid, the backend returns 401 — catch that
// globally and bounce the user back to login rather than handling it in
// every single component that makes a request.
//
// Exception: on public pages (login, register, home) a 401 is expected and
// harmless — e.g. Register's department dropdown calls GET /services, which
// requires auth, and there is none yet. Redirecting in that case is what was
// causing Register to flash and immediately bounce back to /login. Only
// force the redirect when the person was actually on a page that assumed
// they were logged in.
const PUBLIC_PATHS = ["/login", "/register", "/", "/oauth-success"];

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onPublicPage = PUBLIC_PATHS.includes(window.location.pathname);
      if (!onPublicPage) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;