import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type PrivateRouteProps = {
  children: React.ReactNode;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  
  useEffect(() => {
  }, [user]);
  
  if (!user) {
    console.error("❌ [PrivateRoute] User is null, redirecting to /login", {
      pathname: window.location.pathname,
      hasTokenInStorage: !!localStorage.getItem("token"),
      hasUserInStorage: !!localStorage.getItem("user"),
      tokenValue: localStorage.getItem("token")?.substring(0, 20) + "...",
      userValue: localStorage.getItem("user")?.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
      stack: new Error().stack,
    });
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
