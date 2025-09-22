import React from "react";
import { useLocation } from "react-router-dom";
import { DashboardProvider } from "./layouts/DashboardContext";

export default function App() {
  return (
    <DashboardProvider>
      <DashboardAppContent />
    </DashboardProvider>
  );
}
