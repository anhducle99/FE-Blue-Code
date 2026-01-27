import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getCallHistory, ICallLog } from "../services/historyService";
import { useSocket } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { getUsers, IUser } from "../services/userService";
import { getDepartments, IDepartment } from "../services/departmentService";

interface Props {
  filters: {
    nguoi_gui?: string;
    nguoi_nhan?: string;
    bat_dau?: string;
    ket_thuc?: string;
  };
}

const PAGE_SIZE = 15;

const COLUMN_WIDTHS = {
  STT: "60px",
  KhoaGui: "200px",
  KhoaNhan: "200px",
  NguoiNhan: "200px",
  TrangThai: "180px",
  ThoiGianGui: "180px",
  ThoiGianXacNhan: "180px",
};

const STATUS_CONFIG: Record<
  string,
  { text: string; bg: string; textColor: string; bullet: string }
> = {
  accepted: {
    text: "Đã xác nhận",
    bg: "bg-green-50",
    textColor: "text-green-700",
    bullet: "bg-green-700",
  },
  "Đã xác nhận": {
    text: "Đã xác nhận",
    bg: "bg-green-50",
    textColor: "text-green-700",
    bullet: "bg-green-700",
  },
  rejected: {
    text: "Không tham gia",
    bg: "bg-red-50",
    textColor: "text-red-700",
    bullet: "bg-red-700",
  },
  "Từ chối": {
    text: "Không tham gia",
    bg: "bg-red-50",
    textColor: "text-red-700",
    bullet: "bg-red-700",
  },
  timeout: {
    text: "Không liên lạc được",
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    bullet: "bg-gray-800",
  },
  pending: {
    text: "Không liên lạc được",
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    bullet: "bg-gray-800",
  },
  "Không liên lạc được": {
    text: "Không liên lạc được",
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    bullet: "bg-gray-800",
  },
  cancelled: {
    text: "Đã hủy",
    bg: "bg-orange-50",
    textColor: "text-orange-700",
    bullet: "bg-orange-600",
  },
  "Đã hủy": {
    text: "Đã hủy",
    bg: "bg-orange-50",
    textColor: "text-orange-700",
    bullet: "bg-orange-600",
  },
  unreachable: {
    text: "Không liên lạc được",
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    bullet: "bg-gray-800",
  },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN", { hour12: false });
};

const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

export const HistoryTable: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<ICallLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [allDepartments, setAllDepartments] = useState<IDepartment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          getUsers(),
          getDepartments(),
        ]);
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const departments = Array.isArray(departmentsResponse.data.data)
          ? departmentsResponse.data.data
          : [];
        setAllUsers(users);
        setAllDepartments(departments);
      } catch (error) {
        setAllUsers([]);
        setAllDepartments([]);
      }
    };

    fetchData();
  }, [user]);

  const currentOrganizationId = useMemo(() => {
    if (!user || !allUsers.length) return null;
    const currentUserFromApi = allUsers.find((u) => u.id === user.id);
    return currentUserFromApi?.organization_id || null;
  }, [user, allUsers]);

  const organizationUsers = useMemo(() => {
    if (!currentOrganizationId) return [];
    return allUsers.filter((u) => u.organization_id === currentOrganizationId);
  }, [allUsers, currentOrganizationId]);

  const organizationDepartments = useMemo(() => {
    if (!currentOrganizationId) return [];
    return allDepartments.filter(
      (d) => d.organization_id === currentOrganizationId
    );
  }, [allDepartments, currentOrganizationId]);

  const userMapByName = useMemo(() => {
    const map = new Map<string, IUser>();
    organizationUsers.forEach((u) => {
      map.set(normalizeName(u.name), u);
    });
    return map;
  }, [organizationUsers]);

  const departmentMapByName = useMemo(() => {
    const map = new Map<string, IDepartment>();
    organizationDepartments.forEach((d) => {
      map.set(normalizeName(d.name), d);
    });
    return map;
  }, [organizationDepartments]);

  const organizationNames = useMemo(() => {
    const names = new Set<string>();
    organizationUsers.forEach((u) => {
      names.add(normalizeName(u.name));
    });
    organizationDepartments.forEach((d) => {
      names.add(normalizeName(d.name));
    });
    return names;
  }, [organizationUsers, organizationDepartments]);

  const filteredData = useMemo(() => {
    if (!currentOrganizationId || organizationNames.size === 0) {
      return data;
    }
    
    return data.filter((log) => {
      const normalizedSender = normalizeName(log.sender);
      const normalizedReceiver = normalizeName(log.receiver);
      
      return (
        organizationNames.has(normalizedSender) ||
        organizationNames.has(normalizedReceiver)
      );
    });
  }, [data, currentOrganizationId, organizationNames]);

  const getReceiverInfo = useCallback(
    (receiver: string) => {
      const normalizedReceiver = normalizeName(receiver);
      const department = departmentMapByName.get(normalizedReceiver);
      if (department) {
        const departmentUser = organizationUsers.find(
          (u) => u.department_id === department.id
        );
        return {
          departmentName: department.name,
          userName: departmentUser?.name || "",
        };
      }

      const user = userMapByName.get(normalizedReceiver);
      if (user && user.department_id) {
        const userDepartment = organizationDepartments.find(
          (d) => d.id === user.department_id
        );
        return {
          departmentName: userDepartment?.name || "",
          userName: user.name,
        };
      }

      return {
        departmentName: receiver,
        userName: "",
      };
    },
    [departmentMapByName, userMapByName, organizationUsers, organizationDepartments]
  );

  const identifier = useMemo(() => {
    if (!user) return null;
    if (!user.department_id) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket } = useSocket(identifier);

  const fetchData = useCallback(async () => {
    try {
      const res = await getCallHistory(filters);
      setData(res);
    } catch {
      setData([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleCallLogUpdate = () => {
      fetchData();
    };

    const handleCallStatusUpdate = () => {
      fetchData();
    };

    socket.on("callLogCreated", handleCallLogUpdate);
    socket.on("callStatusUpdate", handleCallStatusUpdate);
    socket.on("callLogUpdated", handleCallLogUpdate);

    return () => {
      socket.off("callLogCreated", handleCallLogUpdate);
      socket.off("callStatusUpdate", handleCallStatusUpdate);
      socket.off("callLogUpdated", handleCallLogUpdate);
    };
  }, [socket, fetchData]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentData = filteredData.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const renderStatus = (status: string) => {
    const config = STATUS_CONFIG[status] || {
      text: status,
      bg: "bg-gray-100",
      textColor: "text-gray-800",
      bullet: "bg-gray-800",
    };

    return (
      <div
        className={`${config.bg} ${config.textColor} rounded-lg px-3 py-1.5 inline-flex items-center gap-2`}
      >
        <span className={`${config.bullet} w-1.5 h-1.5 rounded-full`}></span>
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  const getCellStyle = (width: string, withEllipsis = false) => ({
    width,
    ...(withEllipsis && {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
  });

  const getConfirmationTime = (row: ICallLog) => {
    if (row.accepted_at) return formatDate(row.accepted_at);
    if (row.rejected_at) return formatDate(row.rejected_at);
    return "";
  };

  const getButtonClass = (isDisabled: boolean) =>
    `px-4 py-2 rounded border ${
      isDisabled
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;

  const renderCardView = () => (
    <div className="md:hidden space-y-3">
      {currentData.map((row, idx) => (
        <div
          key={row.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-semibold text-gray-500">
              #{startIndex + idx + 1}
            </div>
            <div>{renderStatus(row.status)}</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Khoa gửi:
              </span>
              <span className="text-gray-800 flex-1">{row.sender}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Sự cố:
              </span>
              <span className="text-gray-800 flex-1">
                {getReceiverInfo(row.receiver).departmentName}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Người xử lý:
              </span>
              <span className="text-gray-800 flex-1">
                {row.status === "accepted" 
                  ? getReceiverInfo(row.receiver).userName || "-"
                  : "-"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Thời gian gửi:
              </span>
              <span className="text-gray-800 flex-1">
                {formatDate(row.created_at)}
              </span>
            </div>
            {getConfirmationTime(row) && (
              <div className="flex items-start">
                <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                  Xác nhận:
                </span>
                <span className="text-gray-800 flex-1">
                  {getConfirmationTime(row)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {currentData.length > 0 ? (
        renderCardView()
      ) : (
        <div className="md:hidden text-center py-8 text-gray-500">
          Không có dữ liệu
        </div>
      )}

      <div className="hidden md:block overflow-x-auto -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full border" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.STT }}
                >
                  STT
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.KhoaGui }}
                >
                  Tầng phòng
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.KhoaNhan }}
                >
                  Sự cố
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.NguoiNhan }}
                >
                  Người xử lý
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.TrangThai }}
                >
                  Trạng thái
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.ThoiGianGui }}
                >
                  Thời gian gửi
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.ThoiGianXacNhan }}
                >
                  Thời gian xác nhận
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td
                      className="border px-3 sm:px-4 py-2 text-center text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.STT)}
                    >
                      {startIndex + idx + 1}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.KhoaGui, true)}
                      title={row.sender}
                    >
                      {row.sender}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.KhoaNhan, true)}
                      title={getReceiverInfo(row.receiver).departmentName}
                    >
                      {getReceiverInfo(row.receiver).departmentName}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.NguoiNhan, true)}
                      title={row.status === "accepted" 
                        ? getReceiverInfo(row.receiver).userName || "-"
                        : "-"}
                    >
                      {row.status === "accepted" 
                        ? getReceiverInfo(row.receiver).userName || "-"
                        : "-"}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.TrangThai)}
                    >
                      <div className="flex justify-center">
                        {renderStatus(row.status)}
                      </div>
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.ThoiGianGui)}
                    >
                      {formatDate(row.created_at)}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.ThoiGianXacNhan)}
                    >
                      {getConfirmationTime(row)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            Tổng: <span className="font-semibold">{filteredData.length}</span> mục
            {totalPages > 1 && (
              <span className="ml-2">
                (Trang {currentPage}/{totalPages})
              </span>
            )}
          </div>
          <div className="flex gap-2 order-1 sm:order-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`${getButtonClass(
                currentPage === 1
              )} text-xs sm:text-sm`}
            >
              <span className="hidden sm:inline">Trang trước</span>
              <span className="sm:hidden">Trước</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`${getButtonClass(
                currentPage >= totalPages
              )} text-xs sm:text-sm`}
            >
              <span className="hidden sm:inline">Trang sau</span>
              <span className="sm:hidden">Sau</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
