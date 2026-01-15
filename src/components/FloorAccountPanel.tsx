import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../layouts/DashboardContext";
import { getUsers, IUser } from "../services/userService";
import { getDepartments } from "../services/departmentService";
import DepartmentButton from "./DepartmentButton";
import SupportButton from "./SupportButton";

export const FloorAccountPanel: React.FC = () => {
  const { user } = useAuth();
  const { supportContacts } = useDashboard();
  const [floorAccountUsers, setFloorAccountUsers] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const usersResponse = await getUsers();
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const currentUserFromApi = users.find((u) => u.id === user.id);
        const orgId = currentUserFromApi?.organization_id;
        setCurrentOrganizationId(orgId || null);
        if (!orgId) {
          setFloorAccountUsers([]);
          setDepartments([]);
          return;
        }
        
       
        const floorUsers = users.filter(
          (u) => u.is_floor_account === true && u.organization_id === orgId
        );
        setFloorAccountUsers(floorUsers);
        
      
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 [FloorAccountPanel] Organization ID:", orgId);
          console.log("🔍 [FloorAccountPanel] Floor account users found:", floorUsers.length);
          console.log("🔍 [FloorAccountPanel] Floor users:", floorUsers.map(u => ({ id: u.id, name: u.name })));
        }
        
     
        const deptResponse = await getDepartments();
        const allDepartments = Array.isArray(deptResponse.data.data) ? deptResponse.data.data : [];   
        const filteredDepartments = allDepartments.map((d, idx) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone || "",
        }));
        setDepartments(filteredDepartments);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setFloorAccountUsers([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col min-h-0">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">
        Tài khoản Tầng phòng
      </h2>
      
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {floorAccountUsers.map((u) => {
              const isCurrentUser = u.id === user?.id;
              
              return (
                <DepartmentButton
                  key={`floor-user-${u.id}`}
                  name={u.name}
                  phone={u.phone || "N/A"}
                  isSelected={false}
                  onClick={() => {}}
                  disabled={isCurrentUser}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
