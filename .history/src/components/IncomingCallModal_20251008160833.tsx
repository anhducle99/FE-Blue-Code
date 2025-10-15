import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallModalProps {
  visible: boolean;
  fromDept: string;
  message: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  fromDept,
  message,
  onAccept,
  onReject,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              📞 Cuộc gọi đến
            </h2>
            <p className="text-gray-700 font-semibold mb-1">
              {fromDept || "Không rõ khoa"}
            </p>
            <p className="text-gray-500 mb-6 italic">{message}</p>

            <div className="flex justify-center gap-6">
              <button
                onClick={onAccept}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg"
              >
                <Phone size={20} />
                Chấp nhận
              </button>
              <button
                onClick={onReject}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg"
              >
                <PhoneOff size={20} />
                Từ chối
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
