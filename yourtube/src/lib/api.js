export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/video/") || path.startsWith("video/")) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/${cleanPath}`;
};
