import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface IncomingCallModalProps {
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
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-[320px] text-center shadow-xl"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              📞 Cuộc gọi đến
            </h2>
            <p className="text-gray-600 mb-4">
              <strong>{fromDept}</strong> đang gọi cho bạn
            </p>
            <p className="text-gray-500 italic mb-6">{message}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onAccept}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Chấp nhận
              </button>
              <button
                onClick={onReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Từ chối
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default IncomingCallModal;
