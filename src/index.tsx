import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HistoryPage } from "./pages/HistoryPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { DepartmentManagementPage } from "./pages/DepartmentManagementPage";
import { OrganizationManagementPage } from "./pages/OrganizationManagementPage";
import { UsersPage } from "./pages/UsersPage";
import { DepartmentProvider } from "./contexts/DepartmentContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import LoginPage from "./pages/LoginPage";
import App from "./App";
import "./styles/index.css";
import { DashboardProvider } from "./layouts/DashboardContext";
import AudioPermissionWrapper from "./components/AudioPermissionWrapper";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { SuperAdminFilterProvider } from "./contexts/SuperAdminFilterContext";
import { IncidentProvider } from "./contexts/IncidentContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import IncomingCallWrapper from "./components/IncomingCallWrapper";
import { registerServiceWorker } from "./utils/serviceWorkerRegistration";
import { Capacitor } from "@capacitor/core";
import { statusBarService } from "./services/nativeService";
import { App as CapacitorApp } from "@capacitor/app";
import DeepLinkHandler from "./components/DeepLinkHandler";

if (typeof window !== "undefined") {
  if (Capacitor.isNativePlatform()) {
    statusBarService.setStyle("light").catch(console.error);
    statusBarService.setBackgroundColor("#2563eb").catch(console.error);
  }

  if (process.env.NODE_ENV === "development") {
    try {
      const hasToken = localStorage.getItem("token");
      const hasUser = localStorage.getItem("user");
      
     
      
      if (!hasToken || !hasUser) {
        localStorage.clear();
      } else {
      }
    } catch (e) {
      console.error(e);
    }
  }


  if (!Capacitor.isNativePlatform()) {
    if (process.env.NODE_ENV === "production") {
      registerServiceWorker();
    } else {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
        
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
           
          });
        });
        
      }
    }
  }
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SuperAdminFilterProvider>
            <IncidentProvider>
              <DashboardProvider>
                <DepartmentProvider>
                  <OrganizationProvider>
                    <BrowserRouter>
                      <DeepLinkHandler />
                      <IncomingCallWrapper>
                        <Routes>
                          <Route
                            path="/"
                            element={<Navigate to="/login" replace />}
                          />
                          <Route path="/login" element={<LoginPage />} />
                          <Route
                            path="/main"
                            element={
                              <PrivateRoute>
                                <AudioPermissionWrapper>
                                  <App />
                                </AudioPermissionWrapper>
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/dashboard"
                            element={
                              <PrivateRoute>
                                <AudioPermissionWrapper>
                                  <DashboardLayout />
                                </AudioPermissionWrapper>
                              </PrivateRoute>
                            }
                          >
                            <Route index element={<StatisticsPage />} />
                            <Route path="history" element={<HistoryPage />} />
                            <Route
                              path="statistics"
                              element={<StatisticsPage />}
                            />
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
                      </IncomingCallWrapper>
                    </BrowserRouter>
                  </OrganizationProvider>
                </DepartmentProvider>
              </DashboardProvider>
            </IncidentProvider>
          </SuperAdminFilterProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
