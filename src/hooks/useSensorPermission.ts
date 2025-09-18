import { useState, useCallback, useEffect } from "react";

export const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const isInTelegram = () => {
  return (
    navigator.userAgent.includes("Telegram") ||
    window.Telegram?.WebApp?.initData !== undefined
  );
};

export const logSensorEvent = (event: string, details?: any) => {
  console.log(`[Sensor] ${event}`, details || "");
};

export const useSensorPermission = () => {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    if (isInTelegram() && (!saved || saved === "prompt")) {
      return "granted";
    }
    return saved || "prompt";
  });

  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Упрощенная проверка доступности датчиков
  const checkSensorAvailability = useCallback(async (): Promise<boolean> => {
    if (isInTelegram()) {
      return true;
    }

    if (sensorPermission !== "granted") {
      return false;
    }

    // Простая проверка - если браузер поддерживает API, считаем доступным
    try {
      return typeof DeviceOrientationEvent !== "undefined";
    } catch (error) {
      console.error("Sensor check error:", error);
      return false;
    }
  }, [sensorPermission]);

  const requestSensorPermission = useCallback(async () => {
    if (isInTelegram()) {
      setSensorPermission("granted");
      return "granted";
    }

    setIsRequestingPermission(true);

    try {
      if (typeof DeviceOrientationEvent !== "undefined" &&
          (DeviceOrientationEvent as any).requestPermission) {
        
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
        return result;
        
      } else {
        // На устройствах, где разрешение не требуется
        setSensorPermission("granted");
        return "granted";
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
      return "denied";
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  return {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    checkSensorAvailability,
    isInTelegram: isInTelegram(),
  };
};