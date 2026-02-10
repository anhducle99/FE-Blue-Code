import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Modal, Input, Select, Switch, Button, message } from "antd";
import { PageHeader } from "../components/PageHeader";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDepartments } from "../contexts/DepartmentContext";
import { useOrganizations } from "../contexts/OrganizationContext";
import { useAuth } from "../contexts/AuthContext";
import {
  IUser,
  IUserForm,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

const { Option } = Select;
const PAGE_SIZE = 10;

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
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOrgId, setFilterOrgId] = useState<number | "">("");
  const { departments, refreshDepartments } = useDepartments();
  const {
    organizations,
    loading: organizationsLoading,
    error: organizationsError,
    refreshOrganizations,
  } = useOrganizations();
  const {
    user: currentUser,
    updateUser: updateCurrentUser,
    refreshUser,
  } = useAuth();
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isSuperAdmin = currentUser?.role === "SuperAdmin";

  const fetchUsers = async () => {
    try {
      const params = filterOrgId !== "" ? { organization_id: filterOrgId as number } : undefined;
      const res = await getUsers(params);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lấy danh sách người dùng thất bại");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterOrgId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterOrgId]);

  useClickOutside(
    {
      current: {
        contains: (node: Node) =>
          dropdownRefs.current.some((el) => el?.contains(node)),
      },
    } as any,
    () => setDropdownIndex(null)
  );

  const updateDropdownPosition = () => {
    if (dropdownIndex === null) {
      setDropdownCoords(null);
      return;
    }
    const el = dropdownRefs.current[dropdownIndex];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const DROPDOWN_WIDTH = 176;
    const DROPDOWN_HEIGHT = 160;
    const gap = 8;
    let top = rect.bottom + gap;
    let left = rect.right - DROPDOWN_WIDTH;
    if (top + DROPDOWN_HEIGHT > window.innerHeight - gap) top = rect.top - DROPDOWN_HEIGHT - gap;
    if (left < gap) left = gap;
    if (left + DROPDOWN_WIDTH > window.innerWidth - gap) left = window.innerWidth - DROPDOWN_WIDTH - gap;
    if (top < gap) top = gap;
    setDropdownCoords({ top, left });
  };

  useLayoutEffect(() => {
    updateDropdownPosition();
  }, [dropdownIndex]);

  useEffect(() => {
    if (dropdownIndex === null) return;
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [dropdownIndex]);

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
      .matches(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
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
      is_floor_account: false,
    },
    enableReinitialize: true,
    validationSchema: userSchema,
    onSubmit: async (values) => {
      try {
        if (values.is_department_account && !values.department_id) {
          message.error("Vui lòng chọn khoa phòng khi bật tài khoản phòng ban");
          return;
        }

        const deptName = values.department_id
          ? departments.find((d) => d.id === values.department_id)?.name || ""
          : "";

        const payload: IUserForm & { departmentName: string } = {
          ...values,
          departmentName: deptName,
          is_floor_account: values.is_floor_account || false,
        };

        if (!editingUser || values.password) {
          payload.password = values.password || "";
        } else {
          delete payload.password;
        }


        if (process.env.NODE_ENV === "development") {

        }

        if (editingUser) {
          const updated = await updateUser(editingUser.id, payload);

          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );

          if (currentUser && updated.id === currentUser.id) {
            const departmentName = updated.department_name
              ? updated.department_name.trim() || undefined
              : undefined;

            updateCurrentUser({
              id: updated.id,
              name: updated.name,
              email: updated.email,
              role: updated.role as "SuperAdmin" | "Admin" | "User",
              phone: updated.phone,
              department_id: updated.department_id ?? null,
              department_name: departmentName,
              is_admin_view: updated.is_admin_view,
              is_floor_account: updated.is_floor_account || false,
            });
          }

          message.success("Cập nhật người dùng thành công");
        } else {
          const created = await createUser(payload);
          setUsers((prev) => [...prev, created]);
          message.success("Thêm người dùng thành công");
        }
        handleClose();
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Lỗi khi lưu người dùng";
        message.error(errorMessage);
      }
    },
  });

  const handleOpenCreate = async () => {
    setEditingUser(null);
    formik.resetForm();
    await Promise.all([
      refreshOrganizations().catch(console.error),
      refreshDepartments().catch(console.error),
    ]);
    setIsOpen(true);
  };

  const handleOpenEdit = async (user: IUser) => {
    setEditingUser(user);
    await Promise.all([
      refreshOrganizations().catch(console.error),
      refreshDepartments().catch(console.error),
    ]);
    formik.setValues({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      organization_id: user.organization_id ?? 0,
      department_id: user.department_id ?? null,
      departmentName: user.department_id
        ? departments.find((d) => d.id === user.department_id)?.name || ""
        : "",
      is_department_account: user.is_department_account ?? false,
      is_admin_view: user.is_admin_view ?? false,
      is_floor_account: user.is_floor_account ?? false,
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
      message.error("Xóa người dùng thất bại");
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn cấp lại mật khẩu cho ${name}?`)) return;
    try {
      await updateUser(id, { password: "123456Ab@" });
      message.success(`Cấp lại mật khẩu cho ${name} thành công`);
    } catch (err) {
      message.error("Cấp lại mật khẩu thất bại");
    }
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = users.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  useEffect(() => {
    if (totalPages >= 1 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setDropdownIndex(null);
    }
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setDropdownIndex(null);
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader
          title="Người dùng và phân quyền"
          createButton={
            <Button
              type="primary"
              shape="circle"
              className="!bg-[#0365af] !border-[#0365af] !text-white !w-10 !h-10 !min-w-10 !min-h-10 !p-0 !aspect-square shrink-0 flex items-center justify-center"
              onClick={handleOpenCreate}
            >
              <i className="bi bi-plus text-white" />
            </Button>
          }
        />

        <div className="bg-white rounded shadow-sm p-4 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <>
                  <span className="text-sm font-medium text-gray-700">Lọc theo tổ chức:</span>
                  <Select
                    placeholder="Tất cả tổ chức"
                    allowClear
                    className="w-56"
                    value={filterOrgId === "" ? undefined : filterOrgId}
                    onChange={(val) => setFilterOrgId(val ?? "")}
                    options={[
                      { value: "", label: "Tất cả tổ chức" },
                      ...organizations.map((org) => ({
                        value: org.id!,
                        label: org.name,
                      })),
                    ]}
                  />
                </>
              )}
            </div>
          </div>

          <div className="border rounded overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm table-fixed">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
              </colgroup>
              <thead className="bg-gray-100">
                <tr className="text-left border-b">
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tổ chức</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u, index) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 relative">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.organization_name ?? "—"}</td>
                      <td className="px-4 py-3 text-right relative">
                        <div
                          className="relative inline-block"
                          ref={(el) => (dropdownRefs.current[index] = el)}
                        >
                          <Button
                            onClick={() =>
                              setDropdownIndex(
                                dropdownIndex === index ? null : index
                              )
                            }
                            className="!p-0 !w-9 !h-9 !min-w-9 !min-h-9 rounded-full hover:!bg-gray-100 shrink-0 aspect-square flex items-center justify-center"
                          >
                            <i className="bi bi-three-dots-vertical text-lg shrink-0" />
                          </Button>

                      {dropdownIndex === index && dropdownCoords && (
                        <div
                          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 w-36 max-w-[calc(100vw-2rem)] overflow-hidden"
                          style={{
                            top: dropdownCoords.top,
                            left: dropdownCoords.left,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.id, u.name)}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
                          >
                            <i className="bi bi-key mr-3 text-base" />
                            <span className="font-medium">Cấp lại mật khẩu</span>
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenEdit(u);
                              setDropdownIndex(null);
                            }}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
                          >
                            <i className="bi bi-pencil mr-3 text-base" />
                            <span className="font-medium">Sửa</span>
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id, u.name)}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
                          >
                            <i className="bi bi-trash mr-3 text-base" />
                            <span className="font-medium">Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có người dùng
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 text-sm text-zinc-700 pt-5">
            <div className="order-2 sm:order-1">
              Tổng: {users.length} người dùng
              {totalPages > 1 && (
                <span className="ml-2">
                  (Trang {currentPage}/{totalPages})
                </span>
              )}
            </div>
            {users.length > 0 && totalPages > 1 && (
              <div className="flex gap-2 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded border text-xs sm:text-sm ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-zinc-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="hidden sm:inline">Trang trước</span>
                  <span className="sm:hidden">Trước</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className={`px-4 py-2 rounded border text-xs sm:text-sm ${
                    currentPage >= totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-zinc-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <span className="sm:hidden">Sau</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={
          <span className="text-lg font-semibold text-[#0365af]">
            {editingUser ? "Sửa người dùng" : "Thêm người dùng"}
          </span>
        }
        open={isOpen}
        onCancel={handleClose}
        onOk={async () => {
          const errors = await formik.validateForm();
          if (Object.keys(errors).length > 0) {
            formik.setTouched(
              Object.keys(errors).reduce((acc, key) => {
                acc[key] = true;
                return acc;
              }, {} as any)
            );
            message.error("Vui lòng điền đầy đủ thông tin");
            return;
          }
          formik.submitForm();
        }}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        okButtonProps={{
          className: "!bg-[#0365af] !border-[#0365af] !text-white",
          loading: formik.isSubmitting,
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
                loading={organizationsLoading}
                notFoundContent={
                  organizationsLoading
                    ? "Đang tải..."
                    : organizationsError
                      ? `Lỗi: ${organizationsError}`
                      : organizations.length === 0
                        ? "Không có tổ chức nào"
                        : "Không tìm thấy"
                }
                status={
                  formik.touched.organization_id &&
                    formik.errors.organization_id
                    ? "error"
                    : ""
                }
              >
                {organizations.map((org) => (
                  <Option key={org.id} value={org.id}>
                    {org.name}
                  </Option>
                ))}
              </Select>
              {formik.touched.organization_id &&
                formik.errors.organization_id && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.organization_id}
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
                status={
                  formik.touched.name && formik.errors.name ? "error" : ""
                }
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
                status={
                  formik.touched.email && formik.errors.email ? "error" : ""
                }
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
                  status={
                    formik.touched.password && formik.errors.password
                      ? "error"
                      : ""
                  }
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.password}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc
                  biệt
                </p>
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
                status={
                  formik.touched.phone && formik.errors.phone ? "error" : ""
                }
              />
              {formik.touched.phone && formik.errors.phone && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.phone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoa phòng
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
                  if (departmentId && !formik.values.is_department_account) {
                    formik.setFieldValue("is_department_account", true);
                  }
                }}
                allowClear={!formik.values.is_department_account}
                disabled={formik.values.is_floor_account || formik.values.is_admin_view}
                className="w-full"
                status={
                  formik.touched.department_id && formik.errors.department_id
                    ? "error"
                    : ""
                }
              >
                {departments.map((dept) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
              {formik.touched.department_id && formik.errors.department_id && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.department_id}
                </div>
              )}
              {!formik.values.is_department_account && (
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu user không thuộc khoa nào (giống admin nhưng
                  không có quyền xem dữ liệu)
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="bg-orange-50/80 border border-orange-100 rounded-lg px-4 py-2.5 mb-4">
              <p className="text-sm font-semibold text-gray-800">Quyền & loại tài khoản</p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="shrink-0 inline-flex items-center [&_.ant-switch]:!min-w-[44px] [&_.ant-switch]:!h-6">
                  <Switch
                    checked={formik.values.is_department_account}
                    onChange={(val) => {
                      formik.setFieldValue("is_department_account", val);
                      if (val) {
                        formik.setFieldValue("is_floor_account", false);
                        formik.setFieldValue("is_admin_view", false);
                        if (!formik.values.department_id) {
                          message.warning(
                            "Vui lòng chọn khoa phòng khi bật tài khoản phòng ban"
                          );
                        }
                      } else {
                        formik.setFieldValue("department_id", null);
                        formik.setFieldValue("departmentName", "");
                      }
                    }}
                    disabled={formik.values.is_floor_account}
                  />
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Tài khoản xử lý sự cố
                </span>
              </label>
              <label className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="shrink-0 inline-flex items-center [&_.ant-switch]:!min-w-[44px] [&_.ant-switch]:!h-6">
                  <Switch
                    checked={formik.values.is_floor_account || false}
                    onChange={(val) => {
                      formik.setFieldValue("is_floor_account", val);
                      if (val) {
                        formik.setFieldValue("is_department_account", false);
                        formik.setFieldValue("is_admin_view", false);
                        formik.setFieldValue("department_id", null);
                        formik.setFieldValue("departmentName", "");
                      }
                    }}
                    disabled={formik.values.is_department_account}
                  />
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Tầng phòng
                </span>
              </label>
              <label className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg cursor-pointer select-none hover:bg-gray-50 transition-colors">
                <span className="shrink-0 inline-flex items-center [&_.ant-switch]:!min-w-[44px] [&_.ant-switch]:!h-6">
                  <Switch
                    checked={formik.values.is_admin_view}
                    onChange={(val) => {
                      formik.setFieldValue("is_admin_view", val);
                      if (val) {
                        formik.setFieldValue("department_id", null);
                        formik.setFieldValue("departmentName", "");
                      }
                    }}
                    disabled={formik.values.is_floor_account || formik.values.is_department_account}
                  />
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Có quyền xem toàn bộ dữ liệu
                </span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};
