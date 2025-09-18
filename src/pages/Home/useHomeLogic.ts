import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    return localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt";
  });

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Функция для запроса разрешения
  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
      } else {
        // На устройствах, где разрешение не требуется
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const handleCompassClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};