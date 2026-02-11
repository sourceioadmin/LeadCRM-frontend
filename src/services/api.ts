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
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    console.log(`📡 [API Request]: ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);

    // IMPORTANT:
    // Do not force JSON content-type globally. It breaks file uploads (multipart/form-data)
    // because the browser must set the boundary automatically.
    const isFormData =
      typeof FormData !== "undefined" && config.data && config.data instanceof FormData;
    if (isFormData && config.headers) {
      // Axios headers can be a plain object or AxiosHeaders; handle both safely.
      const h: any = config.headers as any;
      if (typeof h.set === "function") {
        h.set("Content-Type", undefined);
      }
      delete h["Content-Type"];
      delete h["content-type"];
    }

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