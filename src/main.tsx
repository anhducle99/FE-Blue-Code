import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HistoryPage } from "./pages/HistoryPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { DepartmentManagementPage } from "./pages/DepartmentManagementPage";
import { OrganizationManagementPage } from "./pages/OrganizationManagementPage";
import { UsersPage } from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import App from "./App";
import "./styles/index.css";
import { DashboardProvider } from "./layouts/DashboardContext";
import AudioPermissionWrapper from "./components/AudioPermissionWrapper";
import { AuthProvider } from "./contexts/AuthContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <DashboardProvider>
        <BrowserRouter>
          <AudioPermissionWrapper>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<App />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<StatisticsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route
                  path="managements"
                  element={<DepartmentManagementPage />}
                />
                <Route
                  path="organization"
                  element={<OrganizationManagementPage />}
                />
                <Route path="usersPage" element={<UsersPage />} />
              </Route>
              <Route path="*" element={<div>404 - Not Found</div>} />
            </Routes>
          </AudioPermissionWrapper>
        </BrowserRouter>
      </DashboardProvider>
    </AuthProvider>
  </React.StrictMode>
);
