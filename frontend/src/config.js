// Empty string = same origin (for mobile testing with Vite proxy)
export const API_BASE = import.meta.env.VITE_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';
