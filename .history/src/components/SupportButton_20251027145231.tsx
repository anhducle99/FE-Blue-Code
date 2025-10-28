import { Button } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import React from "react";

interface Props {
  label: string;
  phone: string;
  color: string; // ví dụ "#1677ff" hoặc "rgb(25, 130, 196)"
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SupportButton: React.FC<Props> = ({
  label,
  phone,
  color,
  isSelected = false,
  onClick,
  disabled = false,
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: color,
    color: "#fff",
    border: "none",
    width: "100%",
    height: "70px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    boxShadow: isSelected
      ? "0 0 10px rgba(24, 144, 255, 0.6)"
      : "0 2px 6px rgba(0,0,0,0.15)",
    transition: "none", // ❌ tắt animation
  };

  // Ghi đè toàn bộ hiệu ứng hover/focus/active bằng CSS inline
  const overrideStyle: React.CSSProperties = {
    ...baseStyle,
  };

  return (
    <Button
      type="default"
      onClick={onClick}
      disabled={disabled}
      icon={<PhoneOutlined style={{ fontSize: 22 }} />}
      style={overrideStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
        (e.currentTarget as HTMLButtonElement).style.opacity = disabled
          ? "0.6"
          : "1";
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            marginTop: "2px",
            opacity: 0.9,
          }}
        >
          {phone}
        </span>
      </div>
    </Button>
  );
};

export default SupportButton;
