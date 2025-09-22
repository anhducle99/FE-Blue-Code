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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/departments");
      const data = await res.json();

      const deptGroup: Department[] = data
        .filter((d: any) => d.alert_group !== "Lãnh Đạo")
        .map((d: any, idx: number) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone,
        }));

      const supportGroup: SupportContact[] = data
        .filter((d: any) => d.alert_group === "Lãnh Đạo")
        .map((d: any, idx: number) => ({
          id: d.id ?? idx + 1000,
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

  const handleSave = (values: any) => {
    if (editingItem) {
      // ✅ Update
      if ("label" in editingItem) {
        // SupportContact
        setSupportContacts((prev) =>
          prev.map((s) =>
            s.id === editingItem.id
              ? { ...s, label: values.name, phone: values.phone }
              : s
          )
        );
      } else {
        // Department
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingItem.id
              ? { ...d, name: values.name, phone: values.phone }
              : d
          )
        );
      }
      message.success("Cập nhật thành công");
    } else {
      // ✅ Add
      const newId = Date.now();
      if (values.type === "support") {
        setSupportContacts((prev) => [
          ...prev,
          {
            id: newId,
            label: values.name,
            phone: values.phone,
            color: "#2563eb",
          },
        ]);
      } else {
        setDepartments((prev) => [
          ...prev,
          { id: newId, name: values.name, phone: values.phone },
        ]);
      }
      message.success("Thêm mới thành công");
    }
    setIsModalOpen(false);
    form.resetFields();
    setEditingItem(null);
  };

  const handleDelete = (item: Department | SupportContact) => {
    if ("label" in item) {
      setSupportContacts((prev) => prev.filter((s) => s.id !== item.id));
    } else {
      setDepartments((prev) => prev.filter((d) => d.id !== item.id));
    }
    message.success("Xóa thành công");
  };

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

export default DepartmentManagementPage;
