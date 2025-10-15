export const useSocket = (user: RegisterData | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const s = io("http://localhost:5000");
    setSocket(s);

    s.emit("register", {
      name: user.name,
      department_id: user.department_id,
      department_name: user.department_name,
    });

    s.on("incomingCall", (data) => {
      console.log("📞 Incoming call:", data);
      setIncomingCall(data);
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  return { socket, incomingCall, setIncomingCall };
};
