// IncomingCallModal.tsx
import React from "react";

interface IncomingCallModalProps {
  visible: boolean;
  message: string;
  fromDept: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  message,
  fromDept,
  onAccept,
  onReject,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 24,
          width: 320,
          textAlign: "center",
        }}
      >
        <h2>📞 Cuộc gọi đến</h2>
        <p>
          <b>{fromDept}</b> đang gọi cho bạn
        </p>
        <p style={{ fontStyle: "italic", color: "#555" }}>{message}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
            onClick={onAccept}
            style={{
              background: "green",
              color: "white",
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            Chấp nhận
          </button>
          <button
            onClick={onReject}
            style={{
              background: "red",
              color: "white",
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
