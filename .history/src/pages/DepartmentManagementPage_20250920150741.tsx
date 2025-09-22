import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useDashboardContext } from "../layouts/DashboardContext";
import {
  IDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";

const { Option } = Select;

export const DepartmentManagementPage: React.FC = () => {
  const { departments, supportContacts, setDepartments, setSupportContacts, fetchFromAPI } =
    useDashboardContext();

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

  const getColorByAlertGroup = (alert_group: string) => {
    const map: Record<string, string> = {
      "An ninh": "bg-gray-600",
      "Phòng cháy chữa cháy": "bg-red-600",
      "Thất Lạc": "bg-yellow-500",
      "Sửa Chữa": "bg-orange-800",
    };
    return map[alert_group] || "bg-gray-400";
  };

  const fetchDepartmentsHandler = async () => {
    setLoading(true);
    await fetchFromAPI();
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartmentsHandler();
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
        await updateDepartment(editingDept.id, {
          name: formData.name!,
          phone: formData.phone!,
          alert_group: formData.alert_group!,
        });
        message.success("Cập nhật thành công");
      } else {
        await createDepartment({
          name: formData.name!,
          phone: formData.phone!,
          alert_group: formData.alert_group!,
        });
        message.success("Thêm khoa/phòng thành công");
      }

      setIsOpen(false);
      setEditingDept(null);
      setFormData({ name: "", phone: "", alert_group: "" });
      setIsDepartmentAccount(false);

      await fetchDepartmentsHandler();
    } catch (err) {
      console.error(err);
      message.error("Lưu khoa/phòng thất
