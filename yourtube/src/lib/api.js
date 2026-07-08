export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http")) return path;

  // Normalize Windows backslashes to forward slashes for URLs
  const normalizedPath = path.replace(/\\/g, "/");

  if (normalizedPath.startsWith("/video/") || normalizedPath.startsWith("video/")) {
    return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = normalizedPath.replace(/^\//, "");
  return `${base}/${cleanPath}`;
};
