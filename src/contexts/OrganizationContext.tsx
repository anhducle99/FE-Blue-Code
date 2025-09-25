import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  IOrganization,
  getOrganizations,
} from "../services/organizationService";

interface OrganizationContextType {
  organizations: IOrganization[];
  loading: boolean;
  error: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const data = await getOrganizations();
        setOrganizations(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Lỗi khi fetch organizations");
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organizations, loading, error }}>
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
