import React from "react";
import IncidentStatusWidget from "./IncidentStatusWidget";
import IncidentSidebar from "./IncidentSidebar";

// RightSidebar component combines Status Widget and IncidentList

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="w-full h-full flex flex-col border-l overflow-hidden"
      style={{
        borderColor: "rgba(255, 255, 255, 0.1)",
        padding: "12px",
        gap: "12px",
      }}
    >
      {/* Status Widget Section - Top */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          minHeight: "0",
        }}
      >
        <IncidentStatusWidget />
      </div>

      {/* Incident List Section - Bottom */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <IncidentSidebar isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
};

export default RightSidebar;
