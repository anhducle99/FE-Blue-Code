import { createContext, useContext, ReactNode } from "react";

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
  const organizations: Organization[] = [
    { id: 1, name: "Org 1" },
    { id: 2, name: "Org 2" },
  ];

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
