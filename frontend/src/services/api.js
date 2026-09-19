import axios from "axios";

// When running locally, use relative path '' so Vite proxies to localhost:3000 (<10ms).
// In production (Vercel), use VITE_API_URL.
const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

const baseURL = isLocal ? "" : (import.meta.env.VITE_API_URL || "");

const api = axios.create({
    baseURL
});

// Auto-attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 / session expiry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (
                window.location.pathname !== "/login" &&
                window.location.pathname !== "/register"
            ) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;