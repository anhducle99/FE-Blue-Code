import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "../components/PageHeader";
import { ModalAddOrganization } from "../components/ModalAddOrganization";

interface Org {
  id: number;
  name: string;
  created_at: string;
}

export const OrganizationManagementPage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    created_at: true,
  });
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const [data, setData] = useState<Org[]>([
    { id: 1, name: "Bệnh viện Thái Thượng Hoàng", created_at: "2025-07-17" },
    // { id: 2, name: "Phòng khám Đa khoa A", created_at: "2025-09-12" },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const handleEdit = (org: Org, index: number) => {
    setSelectedOrg(org);
    setOpenModal(true);
    setOpenMenuIndex(null);
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((org) => org.id !== id));
    setOpenMenuIndex(null);
  };

  const handleSave = (updated: { name: string }) => {
    if (!selectedOrg) return;
    setData((prev) =>
      prev.map((org) =>
        org.id === selectedOrg.id ? { ...org, name: updated.name } : org
      )
    );
    setOpenModal(false);
    setSelectedOrg(null);
  };

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
                  Name
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
                  Created_at
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
              {data.map((item, index) => (
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
                    {item.created_at}
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full"
                      onClick={() =>
                        setOpenMenuIndex(openMenuIndex === index ? null : index)
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
                          onClick={() => handleDelete(item.id)}
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

        <div className="flex justify-between items-center text-sm text-zinc-700 pt-5">
          <div>Tổng: {data.length} mục</div>
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
      />
    </div>
  );
};
