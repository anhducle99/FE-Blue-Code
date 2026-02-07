import React, { createContext, useContext, useState, useCallback } from "react";

type SuperAdminFilterState = number | "";

interface SuperAdminFilterContextType {
  superAdminOrgFilterId: SuperAdminFilterState;
  setSuperAdminOrgFilterId: (id: SuperAdminFilterState) => void;
}

const SuperAdminFilterContext = createContext<SuperAdminFilterContextType | undefined>(undefined);

export function SuperAdminFilterProvider({ children }: { children: React.ReactNode }) {
  const [superAdminOrgFilterId, setSuperAdminOrgFilterId] = useState<SuperAdminFilterState>("");
  const setFilter = useCallback((id: SuperAdminFilterState) => {
    setSuperAdminOrgFilterId(id);
  }, []);

  return (
    <SuperAdminFilterContext.Provider
      value={{ superAdminOrgFilterId, setSuperAdminOrgFilterId: setFilter }}
    >
      {children}
    </SuperAdminFilterContext.Provider>
  );
}

export function useSuperAdminFilter(): SuperAdminFilterContextType {
  const ctx = useContext(SuperAdminFilterContext);
  if (ctx === undefined) {
    return {
      superAdminOrgFilterId: "",
      setSuperAdminOrgFilterId: () => {},
    };
  }
  return ctx;
}
