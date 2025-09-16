import React, { useState, useRef, useEffect } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { PageHeader } from "../components/PageHeader";
import { MoreVertical } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDepartments } from "../contexts/DepartmentContext";
import {
  IUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users";

const { Option } = Select;

export const UsersPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { departments } = useDepartments();

  // Load users từ API
  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      message.error("Lấy danh sách người dùng thất bại");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Dropdown click outside
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

  const userSchema = Yup.object().shape({
    name: Yup.string().required("Tên không được để trống"),
    email: Yup.string().email("Email không hợp lệ").required("Email bắt buộc"),
    password: Yup.string().when([], {
      is: () => !editingUser,
      then: (schema) =>
        schema
          .required("Mật khẩu không được để trống")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
            "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    phone: Yup.string()
      .required("Số điện thoại không được để trống")
      .matches(/^[0-9]{10}$/, "Số điện thoại phải đúng 10 số"),
    department: Yup.string().required("Vui lòng chọn khoa phòng"),
  });

  const formik = useFormik<Omit<IUser, "id"> & { password?: string }>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      department: "",
      role: "User",
    },
    enableReinitialize: true,
    validationSchema: userSchema,
    onSubmit: async (values) => {
      try {
        if (editingUser) {
          await updateUser(editingUser.id!, values);
          message.success("Cập nhật người dùng thành công");
        } else {
          await createUser(values as any);
          message.success("Thêm người dùng thành công");
        }
        fetchUsers();
        handleClose();
      } catch (err: any) {
        message.error(err.response?.data?.message || "Thao tác thất bại");
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
    formik.setValues({ ...user, password: "" });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingUser(null);
    formik.resetForm();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await deleteUser(id);
      message.success("Xóa người dùng thành công");
      fetchUsers();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Người dùng và phân quyền"
          createButton={
            <Button type="primary" onClick={handleOpenCreate}>
              +
            </Button>
          }
        />
      </div>
      <div className="mx-4 mt-4 bg-white rounded shadow-sm p-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <div ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setDropdownIndex(dropdownIndex === index ? null : index)
                      }
                    >
                      ...
                    </button>
                    {dropdownIndex === index && (
                      <div>
                        <button onClick={() => handleOpenEdit(u)}>Sửa</button>
                        <button onClick={() => handleDelete(u.id!)}>Xóa</button>
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
      >
        <form onSubmit={formik.handleSubmit}>
          <Input
            name="name"
            placeholder="Tên"
            value={formik.values.name}
            onChange={formik.handleChange}
          />
          <Input
            name="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          {!editingUser && (
            <Input.Password
              name="password"
              placeholder="Mật khẩu"
              value={formik.values.password}
              onChange={formik.handleChange}
            />
          )}
          <Input
            name="phone"
            placeholder="Số điện thoại"
            value={formik.values.phone}
            onChange={formik.handleChange}
          />
          <Select
            value={formik.values.department}
            onChange={(val) => formik.setFieldValue("department", val)}
          >
            {departments.map((d) => (
              <Option key={d.id} value={d.name}>
                {d.name}
              </Option>
            ))}
          </Select>
        </form>
      </Modal>
    </>
  );
};
