import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import {
  useDashboard,
  Department,
  SupportContact,
} from "../layouts/DashboardContext";

const DepartmentManagementPage: React.FC = () => {
  const { departments, supportContacts, setDepartments, setSupportContacts } =
    useDashboard();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    Department | SupportContact | null
  >(null);

  const [form] = Form.useForm();

  // ================== FETCH DATA ==================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/departments");
      const data = await res.json();

      const deptGroup: Department[] = data
        .filter((d: any) => d.alert_group !== "Lãnh Đạo")
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
        }));

      const supportGroup: SupportContact[] = data
        .filter((d: any) => d.alert_group === "Lãnh Đạo")
        .map((d: any) => ({
          id: d.id,
          label: d.name,
          phone: d.phone,
          color: d.color || "#2563eb",
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khoa/phòng thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================== SAVE (ADD/UPDATE) ==================
  const handleSave = async (values: any) => {
    try {
      if (editingItem) {
        // ✅ Update
        await fetch(`/api/departments/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            phone: values.phone,
            type: values.type,
          }),
        });
        message.success("Cập nhật thành công");
      } else {
        // ✅ Add
        await fetch(`/api/departments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            phone: values.phone,
            type: values.type,
          }),
        });
        message.success("Thêm mới thành công");
      }
      fetchData(); // reload lại context
      setIsModalOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    }
  };

  // ================== DELETE ==================
  const handleDelete = async (item: Department | SupportContact) => {
    try {
      await fetch(`/api/departments/${item.id}`, { method: "DELETE" });
      message.success("Xóa thành công");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  // ================== TABLE ==================
  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      render: (_: any, record: any) =>
        "label" in record ? record.label : record.name,
    },
    { title: "Số điện thoại", dataIndex: "phone" },
    {
      title: "Loại",
      render: (_: any, record: any) =>
        "label" in record ? "SupportContact" : "Department",
    },
    {
      title: "Hành động",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingItem(record);
              setIsModalOpen(true);
              form.setFieldsValue({
                name: "label" in record ? record.label : record.name,
                phone: record.phone,
                type: "label" in record ? "support" : "department",
              });
            }}
          >
            Sửa
          </Button>
          <Button danger onClick={() => handleDelete(record)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Quản lý khoa & support contacts</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
            form.resetFields();
          }}
        >
          Thêm mới
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={[...departments, ...supportContacts]}
        loading={loading}
      />

      <Modal
        open={isModalOpen}
        title={editingItem ? "Cập nhật" : "Thêm mới"}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="type" label="Loại" initialValue="department">
            <select className="border px-2 py-1 rounded w-full">
              <option value="department">Department</option>
              <option value="support">SupportContact</option>
            </select>
          </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="SĐT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
