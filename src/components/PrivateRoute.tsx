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
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
