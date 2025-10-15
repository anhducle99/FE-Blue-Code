import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import { Button } from "antd";

const socket = io("http://localhost:5000");

interface IncomingCall {
  callerName: string;
  callerId: number;
  callId: string;
}

export const IncomingCallModal: React.FC = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!user) return;

    socket.on("incoming_call", (data: IncomingCall) => {
      console.log("📞 Cuộc gọi đến:", data);
      setIncomingCall(data);
    });

    socket.on("call_cancelled", () => {
      setIncomingCall(null);
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_cancelled");
    };
  }, [user]);

  const handleAccept = () => {
    if (!incomingCall) return;
    socket.emit("accept_call", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall) return;
    socket.emit("reject_call", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-xl w-80 text-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <h2 className="text-lg font-semibold mb-2">📞 Cuộc gọi đến</h2>
            <p className="text-gray-600 mb-4">
              {incomingCall.callerName} đang gọi cho bạn
            </p>

            <div className="flex justify-center gap-4">
              <Button
                type="primary"
                onClick={handleAccept}
                style={{ backgroundColor: "#22c55e" }}
              >
                Chấp nhận
              </Button>
              <Button danger onClick={handleReject}>
                Từ chối
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
