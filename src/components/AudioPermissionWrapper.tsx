import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AudioPermissionModal from "./AudioPermissionModal";

const AudioPermissionWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const navEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    const isReload = navEntry?.type === "reload";

    if (isReload || !localStorage.getItem("audioConfirmed")) {
      setIsOpen(true);
    }
  }, [user]);

  const handleConfirm = () => {
    setIsOpen(false);
    localStorage.setItem("audioConfirmed", "true");
  };

  return (
    <>
      <AudioPermissionModal isOpen={isOpen} onConfirm={handleConfirm} />
      {children}
    </>
  );
};

export default AudioPermissionWrapper;
