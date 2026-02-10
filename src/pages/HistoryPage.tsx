import React, { useState, useEffect } from "react";
import { HistoryTable } from "../components/HistoryTable";
import { PageHeader } from "../components/PageHeader";
import { Input, Button, Select } from "antd";
import { useAuth } from "../contexts/AuthContext";
import { getOrganizations } from "../services/organizationService";
import type { IOrganization } from "../services/organizationService";

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [filters, setFilters] = useState({
    nguoi_gui: "",
    nguoi_nhan: "",
    bat_dau: "",
    ket_thuc: "",
    organization_id: "" as number | string | "",
  });
  const [appliedFilters, setAppliedFilters] = useState<typeof filters>({
    ...filters,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((data) => setOrganizations(Array.isArray(data) ? data : []))
        .catch(() => setOrganizations([]));
    }
  }, [isSuperAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleOrgChange = (value: number | string | null) => {
    setFilters({ ...filters, organization_id: value ?? "" });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const appliedOrgId = appliedFilters.organization_id === "" ? undefined : appliedFilters.organization_id;

  return (
    <>
      <div className="mx-2 sm:mx-4">
        <PageHeader title="Lịch sử" />
      </div>
      <div className="mx-2 sm:mx-4 mt-2 bg-white rounded shadow-sm p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center mb-4 sm:mb-6">
          {isSuperAdmin && (
            <Select
              placeholder="Lọc theo tổ chức"
              allowClear
              className="col-span-1 sm:col-span-1 lg:col-span-2 w-full history-org-select"
              value={filters.organization_id === "" ? undefined : filters.organization_id}
              onChange={handleOrgChange}
              options={[
                { value: "", label: "Tất cả tổ chức" },
                ...organizations.map((org) => ({
                  value: org.id!,
                  label: org.name,
                })),
              ]}
            />
          )}
          <Input
            type="text"
            name="nguoi_gui"
            placeholder="Nhập vị trí sự cố"
            className="col-span-1 sm:col-span-1 lg:col-span-2 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.nguoi_gui}
            onChange={handleChange}
          />
          <Input
            type="text"
            name="nguoi_nhan"
            placeholder="Nhập sự cố"
            className="col-span-1 sm:col-span-1 lg:col-span-2 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.nguoi_nhan}
            onChange={handleChange}
          />
          <Input
            type="date"
            name="bat_dau"
            className="col-span-1 sm:col-span-1 lg:col-span-3 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.bat_dau}
            onChange={handleChange}
          />
          <Input
            type="date"
            name="ket_thuc"
            className="col-span-1 sm:col-span-1 lg:col-span-3 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.ket_thuc}
            onChange={handleChange}
          />
          <Button
            className="col-span-1 sm:col-span-1 lg:col-span-2 h-10 rounded bg-blue-600 text-white font-bold flex justify-center items-center gap-2"
            onClick={handleSearch}
          >
            <i className="bi bi-search" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <span className="sm:hidden">Tìm</span>
          </Button>
        </div>

        <div>
          <HistoryTable filters={{ ...appliedFilters, organization_id: appliedOrgId }} />
        </div>
      </div>
    </>
  );
};
