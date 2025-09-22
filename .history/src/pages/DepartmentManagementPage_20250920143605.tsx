import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button, message } from "antd";
import { MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useDashboardContext, Department } from "../layouts/DashboardContext";

const { Option } = Select;

export const DepartmentManagementPage: React.FC = () => {
  const { group1, group2, addOrUpdateDepartment, deleteDepartment } =
    useDashboardContext();
  const departments = [...group1, ...group2]; // hiển thị gộp

  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: "",
    phone: "",
    alert_group: "",
  });

  useEffect(() => {
    if (editingDept) {
      setFormData({
        name: editingDept.name,
        phone: editingDept.phone,
        alert_group: editingDept.alert_group,
      });
    } else {
      setFormData({ name: "", phone: "", alert_group: "" });
    }
  }, [editingDept, isOpen]);

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.alert_group) {
      message.error("Tên, số điện thoại và nhóm báo động là bắt buộc");
      return;
    }
    addOrUpdateDepartment({ id: editingDept?.id, ...formData } as Department);
    setIsOpen(false);
    setEditingDept(null);
    setFormData({ name: "", phone: "", alert_group: "" });
    message.success(
      editingDept ? "Cập nhật thành công" : "Thêm khoa/phòng thành công"
    );
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa khoa/phòng này?")) return;
    deleteDepartment(id);
    message.success("Xóa thành công");
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
              onClick={() => setIsOpen(true)}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />
      </div>

      <div className="mx-4 mt-4 bg-white rounded shadow-sm p-4">
        {departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có khoa/phòng nào
          </div>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
              <tr>
                <th className="px-4 py-2 text-left">Khoa/Phòng</th>
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
                  <td className="px-4 py-2">{d.alert_group}</td>
                  <td className="px-4 py-2 text-right relative">
                    <Button
                      type="text"
                      icon={<MoreVertical />}
                      onClick={() =>
                        setDropdownIndex(dropdownIndex === index ? null : index)
                      }
                    />
                    {dropdownIndex === index && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
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
      </div>

      <Modal
        open={isOpen}
        title={editingDept ? "Sửa khoa/phòng" : "Thêm khoa/phòng"}
        onCancel={() => setIsOpen(false)}
        onOk={handleSave}
      >
        <div className="space-y-4">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên khoa/phòng"
          />
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="Nhập số điện thoại"
          />
          <Select
            value={formData.alert_group}
            onChange={(val) => setFormData({ ...formData, alert_group: val })}
            placeholder="Chọn nhóm"
          >
            <Option value="Y tế">Y tế</Option>
            <Option value="Sửa Chữa">Sửa Chữa</Option>
            <Option value="Thất Lạc">Thất Lạc</Option>
            <Option value="Phòng cháy chữa cháy">Phòng cháy chữa cháy</Option>
            <Option value="An ninh">An ninh</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
};
