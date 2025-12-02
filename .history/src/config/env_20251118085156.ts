export const config = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:5000",
  socketUrl: process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
  apiBaseUrl: `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api`,
} as const;
