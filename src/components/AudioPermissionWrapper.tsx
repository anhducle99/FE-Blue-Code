import React, { useEffect, useState } from "react";
import AudioPermissionModal from "./AudioPermissionModal";

const AudioPermissionWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const navType = (() => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (nav) return nav.type;
      return (performance as any).navigation?.type === 1
        ? "reload"
        : "navigate";
    })();

    const isReload = navType === "reload";
    const isDirectVisit = navType === "navigate" && document.referrer === "";

    if (isReload || isDirectVisit) {
      setShowModal(true);
    }
  }, []);

  return (
    <>
      <AudioPermissionModal
        isOpen={showModal}
        onConfirm={() => setShowModal(false)}
      />
      {children}
    </>
  );
};

export default AudioPermissionWrapper;
