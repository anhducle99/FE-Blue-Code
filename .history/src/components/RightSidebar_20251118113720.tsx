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
      className="w-full md:w-1/3 h-full flex flex-col border-l overflow-hidden"
      style={{
        backgroundColor: "rgb(3 101 175)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Status Widget Section - Top */}
      <div
        className="flex-shrink-0 border-b overflow-hidden"
        style={{ 
          borderColor: "rgba(255, 255, 255, 0.1)",
          height: "45%",
          minHeight: "350px"
        }}
      >
        <IncidentStatusWidget />
      </div>

      {/* Incident List Section - Bottom */}
      <div 
        className="flex-1 min-h-0 overflow-hidden"
        style={{ height: "55%" }}
      >
        <IncidentSidebar isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
};

export default RightSidebar;
