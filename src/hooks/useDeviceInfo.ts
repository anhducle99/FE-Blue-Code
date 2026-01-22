import { useEffect, useState } from "react";
import { deviceService, DeviceInfo } from "../services/nativeService";

export const useDeviceInfo = (): DeviceInfo | null => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    deviceService
      .getInfo()
      .then(setDeviceInfo)
      .catch((error) => {
        setDeviceInfo(null);
      });
  }, []);

  return deviceInfo;
};
