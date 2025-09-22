import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardProvider, useDashboard } from "./layouts/DashboardContext";
import AppContent from "./AppContent";
import LoginPage from "./pages/LoginPage";

// 👇 Wrapper để gọi fetch toàn app
const DashboardLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { reloadData } = useDashboard();

  useEffect(() => {
    reloadData(); // Fetch dữ liệu ngay khi App chạy
  }, [reloadData]);

  return <>{children}</>;
};

export default function App() {
  return (
    <DashboardProvider>
      <Router>
        <DashboardLoader>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </DashboardLoader>
      </Router>
    </DashboardProvider>
  );
}
