import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, Button, message, Select } from "antd";
import { MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  IDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";
import { useDashboard } from "../layouts/DashboardContext";
import { useDepartments } from "../contexts/DepartmentContext";
import { useOrganizations } from "../contexts/OrganizationContext";
import { useAuth } from "../contexts/AuthContext";
import { getUsers } from "../services/userService";

const { Option } = Select;

export const DepartmentManagementPage: React.FC = () => {
  const { reloadData } = useDashboard();
  const { refreshDepartments } = useDepartments();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const {
    organizations,
    loading: organizationsLoading,
    error: organizationsError,
  } = useOrganizations();
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [currentUserOrgId, setCurrentUserOrgId] = useState<number | null>(null);
  const [filterOrgId, setFilterOrgId] = useState<number | "">("");
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const defaultFilterSetRef = useRef(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<Partial<IDepartment>>({
    name: "",
    phone: "",
    organization_id: undefined,
  });
  const [isDepartmentAccount, setIsDepartmentAccount] = useState(false);

  useEffect(() => {
    const fetchCurrentUserOrg = async () => {
      if (!user) return;
      try {
        const usersRes = await getUsers();
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const currentUserFromApi = users.find((u) => u.id === user.id);
        if (currentUserFromApi?.organization_id) {
          setCurrentUserOrgId(currentUserFromApi.organization_id);
        }
      } catch (error) {
        console.error("Failed to fetch current user organization:", error);
      }
    };
    fetchCurrentUserOrg();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin && organizations.length > 0 && !defaultFilterSetRef.current) {
      setFilterOrgId(organizations[0].id ?? "");
      defaultFilterSetRef.current = true;
    }
  }, [isSuperAdmin, organizations]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = isSuperAdmin && filterOrgId !== "" ? { organization_id: filterOrgId as number } : undefined;
      const res = await getDepartments(params);
      if (res.data.success && Array.isArray(res.data.data)) {
        setDepartments(res.data.data);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      message.error("Lấy danh sách đội phản ứng thất bại");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [filterOrgId]);

  const handleSave = async () => {
    if (!formData.name) {
      message.error("Tên là bắt buộc");
      return;
    }
    if (!formData.organization_id) {
      message.error("Tổ chức là bắt buộc");
      return;
    }

    try {
      if (editingDept && editingDept.id) {
        const res = await updateDepartment(editingDept.id, formData);
        if (res.data.success) {
          message.success("Cập nhật thành công");
          reloadData();
          await refreshDepartments();
          await fetchDepartments();
        }
      } else {
        const res = await createDepartment(formData);
        if (res.data.success) {
          message.success("Thêm đội phản ứng thành công");
          reloadData();
          await refreshDepartments();
          await fetchDepartments();
        }
      }

      setIsOpen(false);
      setEditingDept(null);
      setFormData({ name: "", phone: "", organization_id: undefined });
      setIsDepartmentAccount(false);
    } catch (err) {
      message.error("Lưu đội phản ứng thất bại");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa đội phản ứng này?")) return;

    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      message.success("Xóa thành công");
      reloadData();
      await refreshDepartments();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  const handleAdd = () => {
    setEditingDept(null);
    setFormData({ 
      name: "", 
      phone: "", 
      organization_id: currentUserOrgId || undefined 
    });
    setIsDepartmentAccount(false);
    setIsOpen(true);
  };

  const handleEdit = (dept: IDepartment) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      phone: dept.phone || "",
      organization_id: dept.organization_id || undefined,
    });
    setIsDepartmentAccount(false);
    setIsOpen(true);
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Quản lý đội phản ứng"
          createButton={
            <Button
              type="primary"
              shape="circle"
              className="!bg-[#0365af] !border-[#0365af] !text-white"
              onClick={handleAdd}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />
      </div>

      <div className="mx-4 mt-4 bg-white rounded shadow-sm p-4">
        {isSuperAdmin && organizations.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <div className="relative" ref={filterDropdownRef}>
              <Button
                onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
                className="h-9 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 border-0 flex items-center gap-2"
              >
                <i className="bi bi-funnel-fill text-xs" />
                Lọc theo tổ chức
                <i className="bi bi-caret-down-fill text-xs" />
              </Button>
              {openFilterDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOrgId("");
                      setOpenFilterDropdown(false);
                    }}
                    className={`flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors ${
                      filterOrgId === "" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    Tất cả tổ chức
                  </button>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setFilterOrgId(org.id ?? "");
                        setOpenFilterDropdown(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                        filterOrgId === org.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có đội phản ứng nào
          </div>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
              <tr>
                <th className="px-4 py-2 text-left">Đội Phản Ứng</th>
                <th className="px-4 py-2 text-left">Tổ chức</th>
                <th className="px-4 py-2 text-left">Điện thoại</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {departments.map((d, index) => {
                const org = organizations.find((o) => o.id === d.organization_id);
                return (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2">{d.name}</td>
                    <td className="px-4 py-2">{org?.name || "-"}</td>
                    <td className="px-4 py-2">{d.phone}</td>
                  <td className="px-4 py-2 text-right relative">
                    <Button
                      type="text"
                      icon={<MoreVertical className="w-4 h-4 text-gray-500" />}
                      onClick={() =>
                        setDropdownIndex(dropdownIndex === index ? null : index)
                      }
                    />
                    {dropdownIndex === index && (
                      <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            handleEdit(d);
                            setDropdownIndex(null);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:text-blue-700 transition-colors duration-150"
                        >
                          <i className="bi bi-pencil mr-3 text-base"></i>
                          <span className="font-medium">Sửa</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            handleDelete(d.id);
                            setDropdownIndex(null);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 transition-colors duration-150"
                        >
                          <i className="bi bi-trash mr-3 text-base"></i>
                          <span className="font-medium">Xóa</span>
                        </button>
                      </div>
                    )}
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={isOpen}
        title={editingDept ? "Sửa đội phản ứng" : "Thêm đội phản ứng"}
        onCancel={() => setIsOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        okButtonProps={{
          className: "!bg-[#0365af] !border-[#0365af] !text-white",
        }}
        cancelButtonProps={{ className: "!bg-gray-100 !text-gray-700" }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">
              Tên <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên đội phản ứng"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Tổ chức <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Chọn tổ chức"
              value={formData.organization_id || undefined}
              onChange={(val) => {
                setFormData({ ...formData, organization_id: val ? Number(val) : undefined });
              }}
              className="w-full"
              loading={organizationsLoading}
              notFoundContent={
                organizationsLoading
                  ? "Đang tải..."
                  : organizationsError
                    ? `Lỗi: ${organizationsError}`
                    : organizations.length === 0
                      ? "Không có tổ chức nào"
                      : "Không tìm thấy"
              }
            >
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1">Số điện thoại</label>
            <Input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};
