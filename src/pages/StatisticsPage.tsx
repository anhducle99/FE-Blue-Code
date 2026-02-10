import React, { useEffect, useState, useMemo, useRef } from "react";
import { DepartmentBarChart } from "../components/DepartmentBarChart";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getDepartmentStats,
  getGroupStats,
  IDepartmentStats,
  IGroupStats,
} from "../services/statisticsService";
import { getOrganizations } from "../services/organizationService";
import type { IOrganization } from "../services/organizationService";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "antd";
import { PageHeader } from "../components/PageHeader";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export const StatisticsPage: React.FC = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [departments, setDepartments] = useState<IDepartmentStats[]>([]);
  const [groups, setGroups] = useState<IGroupStats[]>([]);
  const [startDateDept, setStartDateDept] = useState<Date | null>(startOfMonth);
  const [endDateDept, setEndDateDept] = useState<Date | null>(now);
  const [startDateGroup, setStartDateGroup] = useState<Date | null>(
    startOfMonth
  );
  const [endDateGroup, setEndDateGroup] = useState<Date | null>(now);
  const [loadingDept, setLoadingDept] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [errorDept, setErrorDept] = useState<string | null>(null);
  const [errorGroup, setErrorGroup] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [filterOrgId, setFilterOrgId] = useState<number | "">("");
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const defaultFilterSetRef = useRef(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";

  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((data) => setOrganizations(Array.isArray(data) ? data : []))
        .catch(() => setOrganizations([]));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && organizations.length > 0 && !defaultFilterSetRef.current) {
      setFilterOrgId(organizations[0].id ?? "");
      defaultFilterSetRef.current = true;
    }
  }, [isSuperAdmin, organizations]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alertGroupColors: Record<string, string> = {
    "y tế": "#22c55e",
    "lãnh đạo": "#3b82f6",
    "sửa chữa": "#f97316",
    "thất lạc": "#facc15",
    "phòng cháy chữa cháy": "#ef4444",
    "an ninh": "#6b7280",
  };

  const departmentColors = [
    "#3b82f6", 
    "#22c55e", 
    "#f97316", 
    "#ef4444", 
    "#a855f7", 
    "#f59e0b", 
    "#06b6d4", 
    "#84cc16", 
    "#ec4899", 
    "#14b8a6", 
    "#f43f5e", 
    "#8b5cf6", 
    "#10b981", 
    "#f59e0b", 
    "#6366f1", 
    "#ec4899", 
  ];

  const departmentColorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    groups.forEach((group, index) => {
      const label = group.label?.toLowerCase().trim() || "";
      if (alertGroupColors[label]) {
        map[label] = alertGroupColors[label];
      } else {
        map[label] = departmentColors[index % departmentColors.length];
      }
    });
    return map;
  }, [groups]);

  const getColorByLabel = (label?: string) => {
    const normalizedLabel = label?.toLowerCase().trim() || "";
    if (alertGroupColors[normalizedLabel]) {
      return alertGroupColors[normalizedLabel];
    }
    if (departmentColorMap[normalizedLabel]) {
      return departmentColorMap[normalizedLabel];
    }
    return generateColorFromString(normalizedLabel);
  };

  const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % departmentColors.length;
    return departmentColors[index];
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchDepartment = async () => {
      setLoadingDept(true);
      setErrorDept(null);
      try {
       
        
        const res = await getDepartmentStats({
          startDate: startDateDept?.toISOString(),
          endDate: endDateDept?.toISOString(),
          ...(filterOrgId !== "" && isSuperAdmin ? { organization_id: filterOrgId as number } : {}),
        });
     
        
        if (!Array.isArray(res)) {
          setErrorDept("Dữ liệu không đúng định dạng");
          setDepartments([]);
          return;
        }

        const mappedData = res.map((d: any) => ({
          id: Number(d.id),
          name: d.name,
          sent: Number(d.sent) || 0,
          received: Number(d.received) || 0,
        }));
        
        setDepartments(mappedData);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Không thể tải thống kê khoa";
        setErrorDept(errorMessage);
        setDepartments([]);
      } finally {
        setLoadingDept(false);
      }
    };
    fetchDepartment();
  }, [startDateDept, endDateDept, token, filterOrgId, isSuperAdmin]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchGroup = async () => {
      setLoadingGroup(true);
      setErrorGroup(null);
      try {
        const res = await getGroupStats({
          startDate: startDateGroup?.toISOString(),
          endDate: endDateGroup?.toISOString(),
          ...(filterOrgId !== "" && isSuperAdmin ? { organization_id: filterOrgId as number } : {}),
        });
                
        if (!Array.isArray(res)) {
          setErrorGroup("Dữ liệu không đúng định dạng");
          setGroups([]);
          return;
        }

        const mappedData = res.map((g: any) => ({
          label: g.label || "Khác",
          sent: Number(g.sent) || 0,
          received: Number(g.received) || 0,
        }));
        
    
        if (process.env.NODE_ENV === "development") {
        }
        
        setGroups(mappedData);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Không thể tải thống kê nhóm";
        setErrorGroup(errorMessage);
        setGroups([]);
      } finally {
        setLoadingGroup(false);
      }
    };
    fetchGroup();
  }, [startDateGroup, endDateGroup, token, filterOrgId, isSuperAdmin]);

  const groupChartData = (type: "Gửi thông báo" | "Nhận thông báo") => {
    if (groups.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: type,
            data: [],
            backgroundColor: [],
            borderWidth: 1,
          },
        ],
      };
    }
    
    return {
      labels: groups.map((g) => g.label),
      datasets: [
        {
          label: type,
          data: groups.map((g) =>
            type === "Gửi thông báo" ? g.sent : g.received
          ),
          backgroundColor: groups.map((g) => getColorByLabel(g.label)),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="mx-2 sm:mx-4">
      <PageHeader
        title="Thống kê"
        createButton={
          isSuperAdmin && organizations.length > 0 ? (
            <div className="relative" ref={filterDropdownRef}>
              <Button
                onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
                className="h-9 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 border-0 flex items-center gap-2"
              >
                <i className="bi bi-funnel-fill text-xs" />
                Lọc theo tổ chức
                <i className="bi bi-caret-down-fill text-xs" />
              </Button>
              {openFilterDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOrgId("");
                      setOpenFilterDropdown(false);
                    }}
                    className={`flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors ${
                      filterOrgId === "" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    Tất cả tổ chức
                  </button>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setFilterOrgId(org.id ?? "");
                        setOpenFilterDropdown(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                        filterOrgId === org.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={(date) => {
                if (!date) return;
                setStartDateDept(date);
                if (endDateDept && date > endDateDept) {
                  setEndDateDept(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateDept}
              onChange={(date) => {
                if (!date) return;
                if (startDateDept && date < startDateDept) {
                  setEndDateDept(startDateDept);
                } else {
                  setEndDateDept(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="w-full h-[400px] sm:h-[500px] mt-4">
          {loadingDept ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : errorDept ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{errorDept}</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Không có dữ liệu trong khoảng thời gian này</p>
            </div>
          ) : (
            <DepartmentBarChart
              labels={departments.map((d) => d.name)}
              sentData={departments.map((d) => d.sent)}
              receivedData={departments.map((d) => d.received)}
            />
          )}
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={(date) => {
                if (!date) return;
                setStartDateGroup(date);
                if (endDateGroup && date > endDateGroup) {
                  setEndDateGroup(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={(date) => {
                if (!date) return;
                if (startDateGroup && date < startDateGroup) {
                  setEndDateGroup(startDateGroup);
                } else {
                  setEndDateGroup(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
   
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          {loadingGroup ? (
            <div className="col-span-2 flex items-center justify-center h-[350px]">
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : errorGroup ? (
            <div className="col-span-2 flex items-center justify-center h-[350px]">
              <p className="text-red-500">{errorGroup}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center h-[350px]">
              <p className="text-gray-500 text-center mb-2">Không có dữ liệu thống kê nhóm</p>
              <p className="text-gray-400 text-sm text-center">
                Không có dữ liệu thống kê cho khoảng thời gian này.<br />
                Vui lòng chọn khoảng thời gian khác.
              </p>
            </div>
          ) : (
            ["Gửi thông báo", "Nhận thông báo"].map((label) => (
              <div key={label} className="w-full flex flex-col items-center">
                <div className="w-full max-w-[350px] h-[300px] sm:h-[350px]">
                  <Pie
                    data={groupChartData(
                      label as "Gửi thông báo" | "Nhận thông báo"
                    )}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-center mt-4 font-medium">{label}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
