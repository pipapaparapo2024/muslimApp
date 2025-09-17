// useHomeLogic.ts
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // === ЗАПРОС ДОСТУПА К ДАТЧИКАМ ===
  const requestSensorPermission = useCallback(async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (result === "granted") {
          setSensorPermission("granted");
        } else {
          setSensorPermission("denied");
        }
      } else {
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
    }
  }, []);

  // Навигация
  const handleCompassClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};