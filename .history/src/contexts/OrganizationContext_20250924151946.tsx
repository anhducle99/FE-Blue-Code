import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";

interface Organization {
  id: number;
  name: string;
}

interface OrganizationContextType {
  organizations: Organization[];
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await axios.get("/api/organizations"); // endpoint backend của bạn
        setOrganizations(res.data); // giả sử API trả về mảng [{id, name}]
      } catch (err) {
        console.error("❌ Lỗi khi fetch organizations:", err);
      }
    };
    fetchOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organizations }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizations = () => {
  const context = useContext(OrganizationContext);
  if (!context)
    throw new Error(
      "useOrganizations must be used within OrganizationProvider"
    );
  return context;
};
