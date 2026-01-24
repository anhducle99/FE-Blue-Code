import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDepartments, IDepartment } from "../services/departmentService";
import { useAuth } from "./AuthContext";

interface DepartmentContextType {
  departments: IDepartment[];
  loading: boolean;
  error: string | null;
  refreshDepartments: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(
  undefined
);

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartments must be used within DepartmentProvider");
  }
  return context;
};

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDepartments = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setDepartments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getDepartments();
      if (!res.data.success)
        throw new Error("Lấy danh sách khoa/phòng thất bại");
      setDepartments(res.data.data || []);
    } catch (err: any) {
      setError(err.message || "Lỗi khi fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (token && isAuthenticated) {
      refreshDepartments();
    } else {
      setDepartments([]);
      setLoading(false);
      setError(null);
    }
  }, [token, isAuthenticated, refreshDepartments]);

  return (
    <DepartmentContext.Provider
      value={{ departments, loading, error, refreshDepartments }}
    >
      {children}
    </DepartmentContext.Provider>
  );
};
