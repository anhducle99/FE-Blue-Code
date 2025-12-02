const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = 5000;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${port}`;
  }

  return `http://${hostname}:${port}`;
};

const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  return getApiUrl();
};

const apiUrl = getApiUrl();
const socketUrl = getSocketUrl();

export const config = {
  apiUrl,
  socketUrl,
  apiBaseUrl: `${apiUrl}/api`,
} as const;

if (process.env.NODE_ENV === "development") {
  console.log("🔧 Environment Configuration:");
  console.log(
    "  REACT_APP_API_URL:",
    process.env.REACT_APP_API_URL || "NOT SET (using default)"
  );
  console.log(
    "  REACT_APP_SOCKET_URL:",
    process.env.REACT_APP_SOCKET_URL || "NOT SET (using default)"
  );
  console.log("📡 Final API Configuration:");
  console.log("  apiUrl:", apiUrl);
  console.log("  socketUrl:", socketUrl);
  console.log("  apiBaseUrl:", `${apiUrl}/api`);
}
