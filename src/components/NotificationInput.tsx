import React, { useState } from "react";
import { Button, Input } from "antd";
interface Props {
  disabled: boolean;
  onSend: (message: string, image: File | null) => void;
}

export default function NotificationInput({ disabled, onSend }: Props) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(
    "/app/assets/no-img-49b878bf.png"
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSend = () => {
    if (disabled) return;
    onSend(message, image);
    setMessage("");
    setImage(null);
    setPreview("/app/assets/no-img-49b878bf.png");
  };

  return (
    <>
      <p className="mt-10 mb-2 font-bold text-lg text-gray-700 dark:text-white">
        Gửi nội dung thông báo:
      </p>
      <div className="flex flex-wrap md:flex-nowrap gap-6">
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="block p-2.5 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
          placeholder="Nhập nội dung..."
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer border border-gray-300 rounded-lg bg-white flex items-center justify-center md:w-40 w-28 h-40 md:h-40"
        >
          <img
            className="object-cover max-h-full max-w-full rounded-lg"
            src={preview}
            alt="Preview"
          />
        </label>
        <Input
          id="file-input"
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        <Button
          onClick={handleSend}
          disabled={disabled}
          className={`md:w-40 w-28 h-40 rounded-lg flex flex-col justify-center items-center transition ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="text-white md:w-20 md:h-20 w-10 h-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            ></path>
          </svg>
          <p className="text-white font-bold text-lg mt-2">Gọi ngay</p>
        </Button>
      </div>
    </>
  );
}
