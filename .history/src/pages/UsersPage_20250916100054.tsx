import React, { useState, useRef, useEffect } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { PageHeader } from "../components/PageHeader";
import { MoreVertical } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDepartments } from "../contexts/DepartmentContext";
import {
  IUser,
  IUserForm,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

const { Option } = Select;

export const UsersPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { departments } = useDepartments();

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách người dùng thất bại");
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

    if (dropdownIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownIndex]);

  const userSchema = Yup.object().shape({
    organization: Yup.string().required("Vui lòng chọn tổ chức"),
    name: Yup.string().required("Tên không được để trống"),
    email: Yup.string()
      .email("Email không hợp lệ")
      .required("Email bắt buộc")
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ"),
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
    role: Yup.string().oneOf(["Admin", "User"]).required("Vui lòng chọn role"),
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
      role: "User",
    },
    enableReinitialize: true,
    validationSchema: userSchema,
    onSubmit: async (values) => {
      try {
        if (editingUser) {
          const updated = await updateUser(editingUser.id, values);
          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );
          message.success("Cập nhật người dùng thành công");
        } else {
          if (!values.password) {
            message.error("Mật khẩu bắt buộc khi tạo mới");
            return;
          }
          const created = await createUser(
            values as IUserForm & { password: string }
          );
          setUsers((prev) => [...prev, created]);
          message.success("Thêm người dùng thành công");
        }
        handleClose();
      } catch (err) {
        console.error(err);
        message.error("Lỗi khi lưu người dùng");
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
      role: user.role,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingUser(null);
    formik.resetForm();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${name}?`)) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      message.success("Xóa người dùng thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa người dùng thất bại");
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Người dùng và phân quyền"
          createButton={
            <Button
              className="!bg-[#0365af] !border-[#0365af] !text-white !shadow-none hover:!bg-[#02508c] hover:!border-[#02508c]"
              type="primary"
              shape="circle"
              onClick={handleOpenCreate}
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
              <th className="px-4 py-2 text-left">Tên</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {users.map((d, index) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.email}</td>
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
                            handleOpenEdit(d);
                            setDropdownIndex(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
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
        title={
          <span className="text-lg font-semibold text-[#0365af]">
            {editingUser ? "Sửa người dùng" : "Thêm người dùng"}
          </span>
        }
        open={isOpen}
        onCancel={handleClose}
        onOk={formik.submitForm}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        okButtonProps={{
          className: "!bg-[#0365af] !border-[#0365af] !text-white",
        }}
        cancelButtonProps={{ className: "!bg-gray-100 !text-gray-700" }}
      >
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tổ chức <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Chọn tổ chức"
                value={formik.values.organization}
                onChange={(val) => formik.setFieldValue("organization", val)}
                onBlur={() => formik.setFieldTouched("organization", true)}
                className="w-full"
              >
                <Option value="Bệnh viện A">Bệnh viện A</Option>
                <Option value="Bệnh viện B">Bệnh viện B</Option>
              </Select>
              {formik.touched.organization && formik.errors.organization && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.organization}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="Nhập tên"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                name="email"
                placeholder="example@gmail.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.email}
                </div>
              )}
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <Input.Password
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.password}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <Input
                name="phone"
                placeholder="Nhập số điện thoại"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.phone && formik.errors.phone && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.phone}
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoa phòng <span className="text-red-500">*</span>
              </label>
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
              {formik.touched.department && formik.errors.department && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.department}
                </div>
              )}
            </div>
          </div>

          {/* Switches */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <Switch
                checked={formik.values.isDepartmentAccount}
                onChange={(val) =>
                  formik.setFieldValue("isDepartmentAccount", val)
                }
              />
              <span className="ml-2 text-gray-700 font-medium">
                Tài khoản phòng ban
              </span>
            </div>

            <div className="flex items-center">
              <Switch
                checked={formik.values.isDepartment}
                onChange={(val) => formik.setFieldValue("isDepartment", val)}
              />
              <span className="ml-2 text-gray-700 font-medium">
                Có quyền xem toàn bộ dữ liệu
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};
