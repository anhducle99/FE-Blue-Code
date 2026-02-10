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
    organization_id?: number | string;
  };
}

const PAGE_SIZE = 15;

const COLUMN_WIDTHS = {
  STT: "60px",
  KhoaGui: "200px",
  KhoaNhan: "200px",
  NguoiNhan: "200px",
  NguoiTuChoi: "200px",
  NguoiKhongLienLacDuoc: "200px",
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

const isRejectedStatus = (status: string): boolean => {
  const s = (status || "").toLowerCase().trim();
  return s === "rejected" || s === "từ chối";
};

const isUnreachableStatus = (status: string): boolean => {
  const s = (status || "").toLowerCase().trim();
  return (
    s === "timeout" ||
    s === "pending" ||
    s === "unreachable" ||
    s === "không liên lạc được"
  );
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

  const effectiveOrgIdForDisplay = useMemo(() => {
    if (user?.role === "SuperAdmin") {
      const fid = filters.organization_id;
      if (fid !== undefined && fid !== null && fid !== "") {
        const num = typeof fid === "number" ? fid : parseInt(String(fid), 10);
        return !isNaN(num) ? num : null;
      }
      return null;
    }
    return currentOrganizationId;
  }, [user?.role, filters.organization_id, currentOrganizationId]);

  const organizationUsers = useMemo(() => {
    if (effectiveOrgIdForDisplay === null) {
      return user?.role === "SuperAdmin" ? allUsers : [];
    }
    return allUsers.filter((u) => u.organization_id === effectiveOrgIdForDisplay);
  }, [allUsers, effectiveOrgIdForDisplay, user?.role]);

  const organizationDepartments = useMemo(() => {
    if (effectiveOrgIdForDisplay === null) {
      return user?.role === "SuperAdmin" ? allDepartments : [];
    }
    return allDepartments.filter(
      (d) => d.organization_id === effectiveOrgIdForDisplay
    );
  }, [allDepartments, effectiveOrgIdForDisplay, user?.role]);

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
    if (user?.role === "SuperAdmin") {
      return data;
    }
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
  }, [data, currentOrganizationId, organizationNames, user?.role]);

  interface GroupedRow {
    call_id: string;
    id: number;
    sender: string;
    departmentName: string;
    created_at: string;
    accepted_at?: string | null;
    rejected_at?: string | null;
    acceptedNames: string[];
    rejectedNames: string[];
    unreachableNames: string[];
  }

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

  const groupedByIncident = useMemo(() => {
    const byCallId = new Map<string, ICallLog[]>();
    for (const log of filteredData) {
      const list = byCallId.get(log.call_id) || [];
      list.push(log);
      byCallId.set(log.call_id, list);
    }
    const rows: GroupedRow[] = Array.from(byCallId.entries()).map(
      ([callId, logs]) => {
        const first = logs[0];
        const deptName = getReceiverInfo(first.receiver).departmentName;
        const acceptedNames = logs
          .filter((l) => l.status === "accepted")
          .map((l) => getReceiverInfo(l.receiver).userName || l.receiver)
          .filter(Boolean);
        const rejectedNames = logs
          .filter((l) => isRejectedStatus(l.status))
          .map((l) => getReceiverInfo(l.receiver).userName || l.receiver)
          .filter(Boolean);
        const unreachableNames = logs
          .filter((l) => isUnreachableStatus(l.status))
          .map((l) => getReceiverInfo(l.receiver).userName || l.receiver)
          .filter(Boolean);
        const withTime = logs.find((l) => l.accepted_at || l.rejected_at);
        return {
          call_id: callId,
          id: first.id,
          sender: first.sender,
          departmentName: deptName,
          created_at: first.created_at,
          accepted_at: withTime?.accepted_at ?? first.accepted_at,
          rejected_at: withTime?.rejected_at ?? first.rejected_at,
          acceptedNames,
          rejectedNames,
          unreachableNames,
        };
      }
    );
    return rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredData, getReceiverInfo]);

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
  const currentData = groupedByIncident.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const totalPages = Math.ceil(groupedByIncident.length / PAGE_SIZE);

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

  const getConfirmationTime = (row: GroupedRow) => {
    if (row.accepted_at) return formatDate(row.accepted_at);
    if (row.rejected_at) return formatDate(row.rejected_at);
    return "";
  };

  const joinNames = (names: string[]) =>
    names.length ? names.join(", ") : "-";

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
          key={row.call_id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-semibold text-gray-500">
              #{startIndex + idx + 1}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Vị trí sự cố:
              </span>
              <span className="text-gray-800 flex-1">{row.sender}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Sự cố:
              </span>
              <span className="text-gray-800 flex-1">
                {row.departmentName}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Người xử lý:
              </span>
              <span className="text-gray-800 flex-1">
                {joinNames(row.acceptedNames)}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Người từ chối tham gia:
              </span>
              <span className="text-gray-800 flex-1">
                {joinNames(row.rejectedNames)}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-600 w-24 flex-shrink-0">
                Không liên lạc được:
              </span>
              <span className="text-gray-800 flex-1">
                {joinNames(row.unreachableNames)}
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
                  Vị trí sự cố
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
                  style={{ width: COLUMN_WIDTHS.NguoiTuChoi }}
                >
                  Người từ chối tham gia
                </th>
                <th
                  className="border px-3 sm:px-4 py-2 text-left text-xs sm:text-sm"
                  style={{ width: COLUMN_WIDTHS.NguoiKhongLienLacDuoc }}
                >
                  Không liên lạc được
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
                  <tr key={row.call_id} className="hover:bg-gray-50">
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
                      title={row.departmentName}
                    >
                      {row.departmentName}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.NguoiNhan, true)}
                      title={joinNames(row.acceptedNames)}
                    >
                      {joinNames(row.acceptedNames)}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.NguoiTuChoi, true)}
                      title={joinNames(row.rejectedNames)}
                    >
                      {joinNames(row.rejectedNames)}
                    </td>
                    <td
                      className="border px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      style={getCellStyle(COLUMN_WIDTHS.NguoiKhongLienLacDuoc, true)}
                      title={joinNames(row.unreachableNames)}
                    >
                      {joinNames(row.unreachableNames)}
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
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {groupedByIncident.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            Tổng: <span className="font-semibold">{groupedByIncident.length}</span> sự cố
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
