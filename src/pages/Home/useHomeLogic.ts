import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для логирования
const logSensorEvent = (event: string, details?: any) => {
  console.log(`[HomeSensor] ${event}`, details || '');
};

export const useHomeLogic = () => {
  const navigate = useNavigate();

  // Инициализируем состояние из localStorage
  const [sensorPermission, ] = useState<string>(() => {
    return localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt";
  });

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  const handleCompassClick = useCallback(() => {
    logSensorEvent('compass_clicked', { permission: sensorPermission });
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate, sensorPermission]);

  const handleMapClick = useCallback(() => {
    logSensorEvent('map_clicked');
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};