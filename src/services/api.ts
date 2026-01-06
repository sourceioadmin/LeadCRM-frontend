import axios, { AxiosInstance, AxiosResponse } from "axios";

const getBackendURL = (): string => {
  // Check for environment variable first (for production)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Fallback: use same hostname with port 5000
  const currentHost = window.location.hostname;
  return `http://${currentHost}:5000/api`;
};

const api: AxiosInstance = axios.create({
  baseURL: getBackendURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    console.log(`📡 [API Request]: ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);

    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error("❌ [Network Error]: Check if backend is running on port 5000 and accessible on your network.");
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;