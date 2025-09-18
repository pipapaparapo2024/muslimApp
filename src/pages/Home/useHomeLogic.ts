import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Проверка на iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Исправленный запрос разрешения
  const requestSensorPermission = useCallback(async () => {
    if (!isIOS) {
      setSensorPermission("granted");
      return;
    }

    setIsRequestingPermission(true);
    try {
      // Правильный способ запроса на iOS
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        
        if (permissionState === 'granted') {
          setSensorPermission("granted");
          // После получения разрешения можно сразу подписаться на события
          window.addEventListener('deviceorientation', () => {}, { once: true });
        } else {
          setSensorPermission("denied");
          alert(t("sensorPermissionRequired"));
        }
      } else {
        // Для не-iOS устройств
        setSensorPermission("granted");
      }
    } catch (error) {
      console.error('Permission error:', error);
      setSensorPermission("denied");
    } finally {
      setIsRequestingPermission(false);
    }
  }, [isIOS]);

  // Остальные функции без изменений
  const handleCompassClick = useCallback(async (currentPermission: string) => {
    // ... существующая логика
  }, [navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    isIOS, // Добавляем в возвращаемые значения
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};