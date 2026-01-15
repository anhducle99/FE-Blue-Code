import React, { useState, useEffect } from "react";
import { Modal, Input, Button, message } from "antd";
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

export const DepartmentManagementPage: React.FC = () => {
  const { reloadData } = useDashboard();
  const { refreshDepartments } = useDepartments();
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<IDepartment>>({
    name: "",
    phone: "",
  });
  const [isDepartmentAccount, setIsDepartmentAccount] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
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
  }, []);

  const handleSave = async () => {
    if (!formData.name) {
      message.error("Tên là bắt buộc");
      return;
    }

    try {
      if (editingDept && editingDept.id) {
        const res = await updateDepartment(editingDept.id, formData);
        if (res.data.success) {
          setDepartments((prev) =>
            prev.map((d) => (d.id === editingDept.id ? res.data.data : d))
          );
          message.success("Cập nhật thành công");
          reloadData();
          await refreshDepartments();
        }
      } else {
        const res = await createDepartment(formData);
        if (res.data.success) {
          setDepartments((prev) => [...prev, res.data.data]);
          message.success("Thêm đội phản ứng thành công");
          reloadData();
          await refreshDepartments();
        }
      }

      setIsOpen(false);
      setEditingDept(null);
      setFormData({ name: "", phone: "" });
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
    setFormData({ name: "", phone: "" });
    setIsDepartmentAccount(false);
    setIsOpen(true);
  };

  const handleEdit = (dept: IDepartment) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      phone: dept.phone || "",
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
                <th className="px-4 py-2 text-left">Điện thoại</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {departments.map((d, index) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.name}</td>
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
              ))}
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
