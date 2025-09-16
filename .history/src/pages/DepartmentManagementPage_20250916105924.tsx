import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
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
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<IDepartment>>({
    name: "",
    phone: "",
    alert_group: "",
  });
  const [isDepartmentAccount, setIsDepartmentAccount] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      // Đảm bảo rằng res.data là một mảng
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khoa/phòng thất bại");
      setDepartments([]); // Đặt thành mảng rỗng nếu có lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Khi modal mở hoặc sửa
  useEffect(() => {
    if (editingDept) {
      setFormData(editingDept);
      setIsDepartmentAccount(false); // hoặc lấy từ field riêng nếu có
    } else {
      setFormData({ name: "", phone: "", alert_group: "" });
      setIsDepartmentAccount(false);
    }
  }, [editingDept, isOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.alert_group) {
      message.error("Tên và nhóm báo động là bắt buộc");
      return;
    }

    try {
      if (editingDept && editingDept.id) {
        const updated = await updateDepartment(editingDept.id, {
          name: formData.name!,
          phone: formData.phone,
          alert_group: formData.alert_group!,
        });
        setDepartments((prev) =>
          prev.map((d) => (d.id === editingDept.id ? updated.data : d))
        );
        message.success("Cập nhật khoa/phòng thành công");
      } else {
        const created = await createDepartment({
          name: formData.name!,
          phone: formData.phone,
          alert_group: formData.alert_group!,
        });
        setDepartments((prev) => [...prev, created.data]);
        message.success("Thêm khoa/phòng thành công");
      }
      setIsOpen(false);
      setEditingDept(null);
    } catch (err) {
      console.error(err);
      message.error("Lưu khoa/phòng thất bại");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa khoa/phòng này?")) return;
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      message.success("Xóa thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Quản lý khoa, phòng"
          createButton={
            <Button
              type="primary"
              shape="circle"
              className="!bg-[#0365af] !border-[#0365af] !text-white"
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
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : (
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
              {departments?.map((d, index) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.name}</td>
                  <td className="px-4 py-2">{d.phone}</td>
                  <td className="px-4 py-2">{d.alert_group}</td>
                  <td className="px-4 py-2 text-right relative">
                    <Button
                      type="text"
                      icon={<MoreVertical className="w-4 h-4 text-gray-500" />}
                      onClick={() =>
                        setDropdownIndex(dropdownIndex === index ? null : index)
                      }
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
        )}

        {!loading && departments?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có khoa/phòng nào được tạo
          </div>
        )}
      </div>

      <Modal
        open={isOpen}
        title={editingDept ? "Sửa khoa/phòng" : "Thêm khoa/phòng"}
        onCancel={() => setIsOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
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
              value={formData.alert_group}
              onChange={(value) =>
                setFormData({ ...formData, alert_group: value })
              }
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
          <div className="flex items-center mt-2">
            <Switch
              checked={isDepartmentAccount}
              onChange={(val) => setIsDepartmentAccount(val)}
            />
            <span className="ml-2 text-gray-700 font-medium">
              Tài khoản phòng ban
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};
