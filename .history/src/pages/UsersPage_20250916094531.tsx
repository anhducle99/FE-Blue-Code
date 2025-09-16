import React, { useEffect, useState, useRef } from "react";
import { Modal, Input, Select, Switch, Button } from "antd";
import { MoreVertical } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { PageHeader } from "../components/PageHeader";
import {
  IUser,
  createUser,
  updateUser,
  deleteUser,
  getUsers,
} from "../services/users";
import { useDepartments } from "../contexts/DepartmentContext";

const { Option } = Select;

interface IUserForm {
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "User";
  department: string;
  phone: string;
  isDepartmentAccount: boolean;
  isDepartment: boolean;
  organization: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { departments } = useDepartments();

  // Load users từ API
  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data); // res.data là IUser[]
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownIndex(null);
      }
    };
    if (dropdownIndex !== null)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownIndex]);

  const validationSchema = Yup.object().shape({
    organization: Yup.string().required("Vui lòng chọn tổ chức"),
    name: Yup.string().required("Tên không được để trống"),
    email: Yup.string().email("Email không hợp lệ").required("Email bắt buộc"),
    phone: Yup.string()
      .required("Số điện thoại không được để trống")
      .matches(/^[0-9]{10}$/, "Số điện thoại phải đúng 10 số"),
    department: Yup.string().required("Vui lòng chọn khoa phòng"),
    password: Yup.string().when([], {
      is: () => !editingUser,
      then: (schema) =>
        schema
          .required("Mật khẩu không được để trống")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const formik = useFormik<IUserForm>({
    initialValues: {
      organization: "",
      name: "",
      email: "",
      password: "",
      phone: "",
      department: "",
      isDepartmentAccount: false,
      isDepartment: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingUser) {
          const updateData: Partial<IUserForm> & { password?: string } = {
            ...values,
          };
          if (!values.password) delete updateData.password; // password optional khi update
          const updated = await updateUser(editingUser.id!, updateData);
          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );
        } else {
          if (!values.password) {
            alert("Mật khẩu không được để trống");
            return;
          }
          const newUser = await createUser(
            values as IUserForm & { password: string }
          );
          setUsers((prev) => [...prev, newUser]);
        }
        handleClose();
      } catch (err: any) {
        console.error(err);
        alert(err?.response?.data?.message || "Lỗi API");
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    formik.resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (user: IUser) => {
    setEditingUser(user);
    formik.setValues({
      organization: user.organization || "",
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      department: user.department || "",
      isDepartmentAccount: user.isDepartmentAccount || false,
      isDepartment: user.isDepartment || false,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingUser(null);
    formik.resetForm();
  };

  const handleDelete = async (user: IUser) => {
    if (!confirm(`Bạn có chắc muốn xóa ${user.name}?`)) return;
    try {
      await deleteUser(user.id!);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-4">
      <PageHeader
        title="Người dùng và phân quyền"
        createButton={
          <Button type="primary" onClick={handleOpenCreate}>
            Thêm
          </Button>
        }
      />
      <div className="mt-4 bg-white rounded shadow-sm p-4">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
            <tr>
              <th className="px-4 py-2 text-left">Tên</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2 text-right relative">
                  <div ref={dropdownRef} className="inline-block">
                    <button
                      onClick={() =>
                        setDropdownIndex(dropdownIndex === index ? null : index)
                      }
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {dropdownIndex === index && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                        <button
                          onClick={() => {
                            handleOpenEdit(user);
                            setDropdownIndex(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(user);
                            setDropdownIndex(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editingUser ? "Sửa người dùng" : "Thêm người dùng"}
        open={isOpen}
        onCancel={handleClose}
        onOk={formik.submitForm}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Input
            placeholder="Tên"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            placeholder="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {!editingUser && (
            <Input.Password
              placeholder="Mật khẩu"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          )}
          <Input
            placeholder="Số điện thoại"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Select
            placeholder="Chọn khoa phòng"
            value={formik.values.department}
            onChange={(val) => formik.setFieldValue("department", val)}
            className="w-full"
          >
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.name}>
                {dept.name}
              </Option>
            ))}
          </Select>
          <Switch
            checked={formik.values.isDepartmentAccount}
            onChange={(val) => formik.setFieldValue("isDepartmentAccount", val)}
          />{" "}
          Tài khoản phòng ban
          <Switch
            checked={formik.values.isDepartment}
            onChange={(val) => formik.setFieldValue("isDepartment", val)}
          />{" "}
          Có quyền xem toàn bộ dữ liệu
          <Select
            placeholder="Chọn tổ chức"
            value={formik.values.organization}
            onChange={(val) => formik.setFieldValue("organization", val)}
            className="w-full"
          >
            <Option value="Bệnh viện A">Bệnh viện A</Option>
            <Option value="Bệnh viện B">Bệnh viện B</Option>
          </Select>
        </form>
      </Modal>
    </div>
  );
};
