import { Button } from "antd";
import { PhoneOutlined } from "@ant-design/icons";

interface Props {
  label: string;
  phone: string;
  color: string; // Ví dụ: "#1677ff" hoặc "bg-blue-500"
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function SupportButton({
  label,
  phone,
  color,
  isSelected = false,
  onClick,
  disabled = false,
}: Props) {
  const isTailwindColor = color.startsWith("bg-") || color.startsWith("text-");

  const customStyle = !isTailwindColor
    ? {
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
        boxShadow: isSelected
          ? "0 0 10px rgba(24, 144, 255, 0.6)"
          : "0 1px 3px rgba(0,0,0,0.15)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "none", // ❌ tắt toàn bộ hiệu ứng hover/active
      }
    : undefined;

  return (
    <Button
      type={isSelected ? "primary" : "default"}
      disabled={disabled}
      onClick={onClick}
      icon={<PhoneOutlined />}
      style={customStyle}
      className={`${isTailwindColor ? color : ""}`}
    >
      <div className="flex flex-col items-center leading-tight">
        <span>{label}</span>
        <span
          className="text-sm font-medium"
          style={{ opacity: 0.9, marginTop: "2px" }}
        >
          {phone}
        </span>
      </div>
    </Button>
  );
}
