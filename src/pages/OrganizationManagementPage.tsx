import React, { useState, useEffect, useRef } from "react";
import { Button, Input, message, Checkbox } from "antd";
import { PageHeader } from "../components/PageHeader";
import { ModalAddOrganization } from "../components/ModalAddOrganization";
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  IOrganization,
} from "../services/organizationService";
import { useOrganizations } from "../contexts/OrganizationContext";

export const OrganizationManagementPage: React.FC = () => {
  const { refreshOrganizations } = useOrganizations();
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
      message.success("Xóa tổ chức thành công!");
      await fetchOrganizations();
      await refreshOrganizations();
      setOpenMenuIndex(null);
    } catch (err) {
      message.error("Không thể xóa tổ chức");
      setError("Không thể xóa tổ chức");
    }
  };

  const handleSave = async (updated: { name: string }) => {
    try {
      if (selectedOrg && selectedOrg.id) {
        await updateOrganization(selectedOrg.id, { name: updated.name });
        message.success("Cập nhật tổ chức thành công!");
      } else {
        await createOrganization({ name: updated.name });
        message.success("Thêm tổ chức thành công!");
      }

      await fetchOrganizations();
      await refreshOrganizations();

      setOpenModal(false);
      setSelectedOrg(null);
    } catch (err) {
      const errorMsg = selectedOrg
        ? "Không thể cập nhật tổ chức"
        : "Không thể thêm tổ chức";
      message.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleAddNew = () => {
    setSelectedOrg(null);
    setOpenModal(true);
  };

  if (loading) {
    return (
      <div className="mx-4">
        <PageHeader
          title="Quản lý tổ chức"
          createButton={
            <Button
              type="primary"
              shape="circle"
              className="!bg-[#0365af] !border-[#0365af] !text-white"
              onClick={handleAddNew}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />
        <div className="bg-white rounded shadow-sm p-4 mt-2 text-center">
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4">
        <PageHeader
          title="Quản lý tổ chức"
          createButton={
            <Button
              type="primary"
              shape="circle"
              className="!bg-[#0365af] !border-[#0365af] !text-white"
              onClick={handleAddNew}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />
        <div className="bg-white rounded shadow-sm p-4 mt-2">
          <div className="text-red-600 mb-4">{error}</div>
          <Button
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <PageHeader
        title="Quản lý tổ chức"
        createButton={
          <Button
            type="primary"
            shape="circle"
            className="!bg-[#0365af] !border-[#0365af] !text-white"
            onClick={handleAddNew}
          >
            <i className="bi bi-plus text-white" />
          </Button>
        }
      />

      <div className="bg-white rounded shadow-sm p-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
          <div></div>

          <div className="relative">
            <Button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="h-9 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              Hiển thị <i className="bi bi-caret-down-fill text-xs"></i>
            </Button>

            {openDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => toggleColumn("name")}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <Checkbox
                    checked={visibleColumns.name}
                    onChange={() => toggleColumn("name")}
                    className="mr-3"
                  />
                  <span className="font-medium">Tên</span>
                </button>
                <button
                  onClick={() => toggleColumn("created_at")}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                >
                  <Checkbox
                    checked={visibleColumns.created_at}
                    onChange={() => toggleColumn("created_at")}
                    className="mr-3"
                  />
                  <span className="font-medium">Ngày tạo</span>
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
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <Button
                        className="p-2 hover:bg-gray-100 rounded-full"
                        onClick={() =>
                          setOpenMenuIndex(
                            openMenuIndex === index ? null : index
                          )
                        }
                      >
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                      </Button>

                      {openMenuIndex === index && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => handleEdit(item, index)}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:text-blue-700 transition-colors duration-150"
                          >
                            <i className="bi bi-pencil mr-3 text-base"></i>
                            <span className="font-medium">Sửa</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => item.id && handleDelete(item.id)}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 transition-colors duration-150"
                          >
                            <i className="bi bi-trash mr-3 text-base"></i>
                            <span className="font-medium">Xóa</span>
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
        initialData={selectedOrg ? { name: selectedOrg.name } : null}
        mode={selectedOrg ? "edit" : "add"}
      />
    </div>
  );
};
