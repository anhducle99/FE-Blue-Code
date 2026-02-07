import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { legacyStorage } from "../utils/storage";
import { getUsers } from "../services/userService";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "User";
  phone: string;
  department_id?: number | null;
  department_name?: string;
  organization_id?: number | null;
  organization_name?: string | null;
  is_admin_view?: boolean;
  is_floor_account?: boolean;
  is_department_account?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
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
    const loadedUser = legacyStorage.get<User>("user");
    if (process.env.NODE_ENV === "development" && loadedUser) {
     
    }
    return loadedUser;
  });

  const [token, setToken] = useState<string | null>(() => {
    const loadedToken = legacyStorage.get<string>("token");
    return loadedToken;
  });

  const hasRefreshedRef = useRef(false);
  const userRef = useRef(user);
  const tokenRef = useRef(token);

  useEffect(() => {
    userRef.current = user;
   
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  
  }, [token]);

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

  
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [logout]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) {
       
        return prevUser;
      }

      const updatedUser: User = {
        id: userData.id ?? prevUser.id,
        name: userData.name ?? prevUser.name,
        email: userData.email ?? prevUser.email,
        role: userData.role ?? prevUser.role,
        phone: userData.phone ?? prevUser.phone,
        department_id:
          userData.department_id !== undefined
            ? userData.department_id
            : prevUser.department_id,
        department_name:
          userData.department_name !== undefined
            ? userData.department_name
            : prevUser.department_name,
        is_admin_view:
          userData.is_admin_view !== undefined
            ? userData.is_admin_view
            : prevUser.is_admin_view,
        is_floor_account:
          userData.is_floor_account !== undefined
            ? userData.is_floor_account
            : prevUser.is_floor_account,
        is_department_account:
          userData.is_department_account !== undefined
            ? userData.is_department_account
            : prevUser.is_department_account,
      };

      legacyStorage.set("user", updatedUser);
      return updatedUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = userRef.current;
    const currentToken = tokenRef.current;

    if (!currentUser || !currentToken) {
  
      return;
    }

    try {     
      const response = await getUsers();
      const users = Array.isArray(response.data) ? response.data : [];
      const currentUserFromBackend = users.find((u) => u.id === currentUser.id);

      if (currentUserFromBackend) {
        const newUser: User = {
          id: currentUserFromBackend.id,
          name: currentUserFromBackend.name,
          email: currentUserFromBackend.email,
          role: (currentUserFromBackend.role || "User") as
            | "SuperAdmin"
            | "Admin"
            | "User",
          phone: currentUserFromBackend.phone,
          department_id: currentUserFromBackend.department_id ?? null,
          department_name: currentUserFromBackend.department_name || undefined,
          organization_id: currentUserFromBackend.organization_id ?? null,
          organization_name: currentUserFromBackend.organization_name ?? null,
          is_admin_view: currentUserFromBackend.is_admin_view,
          is_floor_account: currentUserFromBackend.is_floor_account || false,
          is_department_account: currentUserFromBackend.is_department_account || false,
        };

        setUser(newUser);
        legacyStorage.set("user", newUser);
      } else {
       
      }
    } catch (error) {
    
      throw error;
    }
  }, []);

  const isAuthenticated = !!user && !!token;

  const contextValue = {
    user,
    token,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
  };


  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
