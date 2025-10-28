import { Button } from "antd";
interface Props {
  label: string;
  phone: string;
  color: string;
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
  disabled,
}: Props) {
  return (
    // <Button
    //   className={`${color} p-[35px] rounded-lg text-white font-bold text-lg flex items-center justify-center gap-8`}
    // >
    //   <svg
    //     xmlns="http://www.w3.org/2000/svg"
    //     fill="none"
    //     viewBox="0 0 24 24"
    //     strokeWidth={1.5}
    //     stroke="currentColor"
    //     className="w-10"
    //   >
    //     <path
    //       strokeLinecap="round"
    //       strokeLinejoin="round"
    //       d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
    //     />
    //   </svg>
    //   <div>
    //     <span>{label}</span>
    //     <h1 className="font-medium text-sm mt-1 flex justify-center gap-2">
    //       {phone}
    //     </h1>
    //   </div>
    // </Button>

    <button
      onClick={onClick}
      className={`p-3 rounded-lg text-white font-semibold text-base w-full shadow-md transition-colors duration-200 ${
        isSelected ? "bg-green-600" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      <div className="text-center">{name}</div>
      <div className="mt-2 text-sm flex justify-center items-center gap-1">
        <PhoneIcon className="w-4 h-4" />
        <span>{phone}</span>
      </div>
    </button>
  );
}
