import React, { createContext, useContext, useState, useCallback } from "react";
import { legacyStorage } from "../utils/storage";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "User";
  phone: string;
  department_id?: number | null;
  department_name?: string;
  is_admin_view?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    return legacyStorage.get<User>("user");
  });

  const [token, setToken] = useState<string | null>(() => {
    return legacyStorage.get<string>("token");
  });

  const login = useCallback((userData: User, tokenValue: string) => {
    setUser(userData);
    setToken(tokenValue);
    legacyStorage.set("user", userData);
    legacyStorage.set("token", tokenValue);
    localStorage.removeItem("audioConfirmed");
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    legacyStorage.remove("user");
    legacyStorage.remove("token");
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
