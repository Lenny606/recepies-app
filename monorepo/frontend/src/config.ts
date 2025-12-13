export const ENV = import.meta.env.VITE_ENV || "development";

export const API_BASE_URL = ENV === "production"
    ? "https://recepies-app-4y6t.onrender.com"
    : "http://localhost:8000";

console.log("API Config Loaded:", { ENV, API_BASE_URL });
