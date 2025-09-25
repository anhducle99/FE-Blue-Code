import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "../components/PageHeader";
import { ModalAddOrganization } from "../components/ModalAddOrganization";
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  IOrganization,
} from "../services/organizationService";

export const OrganizationManagementPage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    created_at: true,
    urlLogo: true,
  });
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [data, setData] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrganizations();

      const organizations = Array.isArray(response) ? response : [];
      setData(organizations);
    } catch (err) {
      setError("Không thể tải danh sách tổ chức");
      console.error("Error fetching organizations:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (col: "name" | "created_at") => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleEdit = (org: IOrganization, index: number) => {
    setSelectedOrg(org);
    setOpenModal(true);
    setOpenMenuIndex(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tổ chức này?")) {
      return;
    }

    try {
      await deleteOrganization(id);
      setData((prev) => prev.filter((org) => org.id !== id));
      setOpenMenuIndex(null);
    } catch (err) {
      setError("Không thể xóa tổ chức");
      console.error("Error deleting organization:", err);
    }
  };

  const handleSave = async (updated: { logo: File | null; name: string }) => {
    try {
      if (selectedOrg && selectedOrg.id) {
        await updateOrganization(selectedOrg.id, { name: updated.name });
        setData((prev) =>
          prev.map((org) =>
            org.id === selectedOrg.id ? { ...org, name: updated.name } : org
          )
        );
      } else {
        const response = await createOrganization({ name: updated.name });
        if (response.data) {
          setData((prev) => [...prev, response.data]);
        }
      }

      setOpenModal(false);
      setSelectedOrg(null);
    } catch (err) {
      setError(
        selectedOrg ? "Không thể cập nhật tổ chức" : "Không thể thêm tổ chức"
      );
      console.error("Error saving organization:", err);
    }
  };

  const handleAddNew = () => {
    setSelectedOrg(null);
    setOpenModal(true);
  };

  if (loading) {
    return (
      <div className="mx-4">
        <PageHeader title="Quản lý tổ chức" />
        <div className="bg-white rounded shadow-sm p-4 mt-2 text-center">
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4">
        <PageHeader title="Quản lý tổ chức" />
        <div className="bg-white rounded shadow-sm p-4 mt-2">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <PageHeader title="Quản lý tổ chức" />

      <div className="bg-white rounded shadow-sm p-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
          <div></div>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="h-9 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              Hiển thị <i className="bi bi-caret-down-fill text-xs"></i>
            </button>

            {openDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
                <button
                  onClick={() => toggleColumn("name")}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.name}
                    readOnly
                    className="mr-2"
                  />
                  Tên
                </button>
                <button
                  onClick={() => toggleColumn("created_at")}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.created_at}
                    readOnly
                    className="mr-2"
                  />
                  Ngày tạo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left border-b">
                <th
                  className={`px-4 py-3 ${
                    !visibleColumns.name ? "invisible" : ""
                  }`}
                >
                  Tên
                </th>
                <th
                  className={`px-4 py-3 ${
                    !visibleColumns.created_at ? "invisible" : ""
                  }`}
                >
                  Tạo lúc
                </th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) &&
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 relative"
                  >
                    <td
                      className={`px-4 py-3 ${
                        !visibleColumns.name ? "invisible" : ""
                      }`}
                    >
                      {item.name}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        !visibleColumns.created_at ? "invisible" : ""
                      }`}
                    >
                      {item.created_at || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-full"
                        onClick={() =>
                          setOpenMenuIndex(
                            openMenuIndex === index ? null : index
                          )
                        }
                      >
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                      </button>

                      {openMenuIndex === index && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg border py-1 z-50"
                        >
                          <button
                            onClick={() => handleEdit(item, index)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => item.id && handleDelete(item.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {Array.isArray(data) && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có tổ chức nào
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-zinc-700 pt-5">
          <div>Tổng: {Array.isArray(data) ? data.length : 0} mục</div>
        </div>
      </div>

      <ModalAddOrganization
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedOrg(null);
        }}
        onSave={handleSave}
        initialData={
          selectedOrg
            ? { name: selectedOrg.name, logoUrl: selectedOrg.logoUrl }
            : null
        }
        mode={selectedOrg ? "edit" : "add"}
      />
    </div>
  );
};
