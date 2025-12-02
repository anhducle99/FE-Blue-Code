import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { PageHeader } from "../components/PageHeader";
import { MoreVertical } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDepartments } from "../contexts/DepartmentContext";
import { useOrganizations } from "../contexts/OrganizationContext";
import {
  IUser,
  IUserForm,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

const { Option } = Select;

function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export const UsersPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const { departments } = useDepartments();
  const { organizations } = useOrganizations();
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách người dùng thất bại");
    }
  };

  useClickOutside(
    {
      current: {
        contains: (node: Node) =>
          dropdownRefs.current.some((el) => el?.contains(node)),
      },
    } as any,
    () => setDropdownIndex(null)
  );

  const userSchema = Yup.object().shape({
    organization_id: Yup.number()
      .required("Vui lòng chọn tổ chức")
      .min(1, "Vui lòng chọn tổ chức"),
    department_id: Yup.number()
      .nullable()
      .when("is_department_account", {
        is: true,
        then: (schema) => schema.required("Vui lòng chọn khoa phòng"),
        otherwise: (schema) => schema.nullable(),
      }),
    name: Yup.string().required("Tên không được để trống"),
    email: Yup.string().email("Email không hợp lệ").required("Email bắt buộc"),
    phone: Yup.string()
      .required("Số điện thoại không được để trống")
      .matches(/^[0-9]{10}$/, "Số điện thoại phải đúng 10 số"),
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

  const formik = useFormik<IUserForm & { departmentName: string }>({
    initialValues: {
      organization_id: 0,
      department_id: null,
      departmentName: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      is_department_account: false,
      is_admin_view: false,
    },
    enableReinitialize: true,
    validationSchema: userSchema,
    onSubmit: async (values) => {
      try {
        const deptName = values.department_id
          ? departments.find((d) => d.id === values.department_id)?.name || ""
          : "";
        const payload: IUserForm & { departmentName: string } = {
          ...values,
          departmentName: deptName,
          password: values.password || "",
        };

        if (editingUser) {
          const updated = await updateUser(editingUser.id, payload);
          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );
          message.success("Cập nhật người dùng thành công");
        } else {
          const created = await createUser(payload);
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
      ...user,
      departmentName: user.department_id
        ? departments.find((d) => d.id === user.department_id)?.name || ""
        : "",
      password: "",
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

  const handleResetPassword = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn cấp lại mật khẩu cho ${name}?`)) return;
    try {
      await updateUser(id, { password: "123456Ab@" });
      message.success(`Cấp lại mật khẩu cho ${name} thành công`);
    } catch (err) {
      console.error(err);
      message.error("Cấp lại mật khẩu thất bại");
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
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {users.length > 0 ? (
              users.map((u, index) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 text-right relative">
                    <div
                      className="inline-block"
                      ref={(el) => (dropdownRefs.current[index] = el)}
                    >
                      <Button
                        onClick={() =>
                          setDropdownIndex(
                            dropdownIndex === index ? null : index
                          )
                        }
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </Button>

                      {dropdownIndex === index && (
                        <div className="absolute left-0 mt-2 w-44 bg-white border rounded shadow-md z-50">
                          <Button
                            onClick={() => handleResetPassword(u.id, u.name)}
                            style={{
                              border: "none",
                              boxShadow: "none",
                              background: "transparent",
                              width: "100%",
                              justifyContent: "flex-start",
                              padding: "0.5rem 1rem",
                            }}
                            className="hover:bg-transparent"
                          >
                            Cấp lại mật khẩu
                          </Button>

                          <Button
                            onClick={() => {
                              handleOpenEdit(u);
                              setDropdownIndex(null);
                            }}
                            style={{
                              border: "none",
                              boxShadow: "none",
                              background: "transparent",
                              width: "100%",
                              justifyContent: "flex-start",
                              padding: "0.5rem 1rem",
                            }}
                            className="hover:bg-transparent"
                          >
                            Sửa
                          </Button>

                          <Button
                            onClick={() => handleDelete(u.id, u.name)}
                            style={{
                              border: "none",
                              boxShadow: "none",
                              background: "transparent",
                              color: "red",
                              width: "100%",
                              justifyContent: "flex-start",
                              padding: "0.5rem 1rem",
                            }}
                            className="hover:bg-transparent"
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Không có người dùng
                </td>
              </tr>
            )}
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
                value={formik.values.organization_id || undefined}
                onChange={(val) => {
                  formik.setFieldValue("organization_id", Number(val));
                }}
                className="w-full"
              >
                {organizations.map((org) => (
                  <Option key={org.id} value={org.id}>
                    {org.name}
                  </Option>
                ))}
              </Select>
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
              />
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
              />
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
                />
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoa phòng{" "}
                {formik.values.is_department_account && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <Select
                placeholder={
                  formik.values.is_department_account
                    ? "Chọn khoa phòng"
                    : "Chọn khoa phòng (hoặc để trống nếu không thuộc khoa nào)"
                }
                value={formik.values.department_id || undefined}
                onChange={(val: number | undefined) => {
                  const departmentId = val || null;
                  formik.setFieldValue("department_id", departmentId);
                  const deptName = departmentId
                    ? departments.find((d) => d.id === departmentId)?.name || ""
                    : "";
                  formik.setFieldValue("departmentName", deptName);
                  // Nếu chọn khoa phòng, tự động bật tài khoản phòng ban
                  if (departmentId && !formik.values.is_department_account) {
                    formik.setFieldValue("is_department_account", true);
                  }
                }}
                allowClear={!formik.values.is_department_account}
                disabled={false}
                className="w-full"
              >
                {departments.map((dept) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
              {!formik.values.is_department_account && (
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu user không thuộc khoa nào (giống admin nhưng
                  không có quyền xem dữ liệu)
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <Switch
                checked={formik.values.is_department_account}
                onChange={(val) => {
                  formik.setFieldValue("is_department_account", val);
                  // Nếu bật tài khoản phòng ban, bắt buộc phải chọn khoa phòng
                  if (val) {
                    // Nếu chưa có department_id, yêu cầu chọn
                    if (!formik.values.department_id) {
                      message.warning("Vui lòng chọn khoa phòng khi bật tài khoản phòng ban");
                    }
                  } else {
                    // Nếu bỏ chọn tài khoản phòng ban, đặt department_id về null
                    formik.setFieldValue("department_id", null);
                    formik.setFieldValue("departmentName", "");
                  }
                }}
              />
              <span className="ml-2 text-gray-700 font-medium">
                Tài khoản phòng ban
              </span>
            </div>
            <div className="flex items-center">
              <Switch
                checked={formik.values.is_admin_view}
                onChange={(val) => formik.setFieldValue("is_admin_view", val)}
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
