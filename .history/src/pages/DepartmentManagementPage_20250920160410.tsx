import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  useDashboard,
  Department,
  SupportContact,
} from "../layouts/DashboardContext";
import {
  IDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";

const { Option } = Select;

type AllItem = {
  id: number;
  name: string;
  phone: string;
  type: "department" | "support" | "leader";
  alert_group: string;
};

export const DepartmentManagementPage: React.FC = () => {
  const {
    departments,
    supportContacts,
    leaders,
    setDepartments,
    setSupportContacts,
    setLeaders,
  } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<IDepartment>>({
    name: "",
    phone: "",
    alert_group: "",
  });
  const [isDepartmentAccount, setIsDepartmentAccount] = useState(false);

  // Mapping alert_group sang màu cho supportContacts
  const getColorByAlertGroup = (alert_group: string) => {
    const map: Record<string, string> = {
      "An ninh": "bg-gray-600",
      "Phòng cháy chữa cháy": "bg-red-600",
      "Thất Lạc": "bg-yellow-500",
      "Sửa Chữa": "bg-orange-800",
      "Lãnh Đạo": "bg-blue-600",
      "Y tế": "bg-green-500",
    };
    return map[alert_group] || "bg-gray-400";
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      const allDepts: IDepartment[] = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      // Phân nhóm theo alert_group
      const deptGroup: Department[] = allDepts
        .filter((d) => d.alert_group === "Y tế")
        .map((d, idx) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone || "",
        }));

      const supportGroup: SupportContact[] = allDepts
        .filter((d) =>
          ["Sửa Chữa", "Thất Lạc", "Phòng cháy chữa cháy", "An ninh"].includes(
            d.alert_group!
          )
        )
        .map((d, idx) => ({
          id: d.id ?? idx + 1000,
          label: d.name,
          phone: d.phone || "",
          color: getColorByAlertGroup(d.alert_group!),
        }));

      const leaderGroup: SupportContact[] = allDepts
        .filter((d) => d.alert_group === "Lãnh Đạo")
        .map((d, idx) => ({
          id: d.id ?? idx + 2000,
          label: d.name,
          phone: d.phone || "",
          color: getColorByAlertGroup(d.alert_group!),
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
      setLeaders(leaderGroup);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khoa/phòng thất bại");
      setDepartments([]);
      setSupportContacts([]);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (editingDept) {
      setFormData(editingDept);
      setIsDepartmentAccount(false);
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
        await updateDepartment(editingDept.id, formData);
        message.success("Cập nhật thành công");
      } else {
        await createDepartment(formData);
        message.success("Thêm khoa/phòng thành công");
      }

      setIsOpen(false);
      setEditingDept(null);
      setFormData({ name: "", phone: "", alert_group: "" });
      setIsDepartmentAccount(false);

      fetchDepartments();
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
      message.success("Xóa thành công");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  const allItems: AllItem[] = [
    ...departments.map((d) => ({
      ...d,
      type: "department" as const,
      alert_group: "Y tế",
    })),
    ...supportContacts.map((s) => ({
      id: s.id,
      name: s.label,
      phone: s.phone,
      type: "support" as const,
      alert_group: "Hỗ trợ",
    })),
    ...leaders.map((l) => ({
      id: l.id,
      name: l.label,
      phone: l.phone,
      type: "leader" as const,
      alert_group: "Lãnh Đạo",
    })),
  ];

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
        ) : allItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có khoa/phòng nào
          </div>
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
              {allItems.map((d, index) => (
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
                            if (d.type === "department") setEditingDept(d);
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
              onChange={(val) => setFormData({ ...formData, alert_group: val })}
              className="w-full"
              placeholder="Chọn nhóm"
            >
              <Option value="Lãnh Đạo">Lãnh Đạo</Option>
              <Option value="Sửa Chữa">Sửa Chữa</Option>
              <Option value="Thất Lạc">Thất Lạc</Option>
              <Option value="Phòng cháy chữa cháy">Phòng cháy chữa cháy</Option>
              <Option value="An ninh">An ninh</Option>
              <Option value="Y tế">Y tế</Option>
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
