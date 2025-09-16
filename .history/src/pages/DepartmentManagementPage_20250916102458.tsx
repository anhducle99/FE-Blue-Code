import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button, message } from "antd";
import { MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  IDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";

const { Option } = Select;

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<IDepartment>({
    id: Date.now(),
    name: "",
    phone: "",
    alert_group: "",
    isDepartmentAccount: false,
  });

  // Load danh sách departments từ API
  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khoa/phòng thất bại");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (editingDept) {
      setFormData(editingDept);
    } else {
      setFormData({
        id: Date.now(),
        name: "",
        phone: "",
        group: "",
        isDepartmentAccount: false,
      });
    }
  }, [editingDept, isOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.group) {
      message.error("Tên và Nhóm báo động là bắt buộc!");
      return;
    }

    try {
      if (editingDept) {
        const updated = await updateDepartment(editingDept.id, formData);
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        message.success("Cập nhật khoa/phòng thành công");
      } else {
        const created = await createDepartment(formData);
        setDepartments((prev) => [...prev, created]);
        message.success("Thêm khoa/phòng thành công");
      }
      setIsOpen(false);
      setEditingDept(null);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu khoa/phòng");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khoa/phòng này?")) return;

    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      message.success("Xóa khoa/phòng thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa khoa/phòng thất bại");
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Quản lý khoa, phòng"
          createButton={
            <Button
              className="!bg-[#0365af] !border-[#0365af] !text-white !shadow-none"
              type="primary"
              shape="circle"
              onClick={() => {
                setEditingDept(null);
                setIsOpen(true);
              }}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />
      </div>

      <div className="mx-4 mt-4 bg-white rounded shadow-sm p-4">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
            <tr>
              <th className="px-4 py-2 text-left">Khoa, phòng</th>
              <th className="px-4 py-2 text-left">Điện thoại</th>
              <th className="px-4 py-2 text-left">Nhóm báo động</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {departments.map((d, index) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.phone}</td>
                <td className="px-4 py-2">{d.group}</td>
                <td className="px-4 py-2 text-right relative">
                  <Button
                    type="text"
                    onClick={() =>
                      setDropdownIndex(dropdownIndex === index ? null : index)
                    }
                    icon={<MoreVertical className="w-4 h-4 text-gray-500" />}
                  />
                  {dropdownIndex === index && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                      <button
                        onClick={() => {
                          alert("Cấp lại mật khẩu cho " + d.name);
                          setDropdownIndex(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Cấp lại mật khẩu
                      </button>
                      <button
                        onClick={() => {
                          setEditingDept(d);
                          setIsOpen(true);
                          setDropdownIndex(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(d.id);
                          setDropdownIndex(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

      <Modal
        open={isOpen}
        title={editingDept ? "Sửa khoa phòng" : "Thêm khoa phòng"}
        onCancel={() => setIsOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{
          className: "!bg-[#0365af] !border-[#0365af] !text-white",
        }}
        cancelButtonProps={{
          className: "!bg-gray-100 !text-gray-700",
        }}
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
              placeholder="Nhập tên khoa/phòng"
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
          <div>
            <label className="block text-sm mb-1">
              Nhóm báo động <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.group}
              onChange={(value) => setFormData({ ...formData, group: value })}
              className="w-full"
              placeholder="Chọn nhóm"
            >
              <Option value="Lãnh Đạo">Lãnh Đạo</Option>
              <Option value="Sửa Chữa">Sửa Chữa</Option>
              <Option value="Thất Lạc">Thất Lạc</Option>
              <Option value="Phòng cháy chữa cháy">Phòng cháy chữa cháy</Option>
              <Option value="An ninh">An ninh</Option>
              <Option value="Y tế">Y tế</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
};
