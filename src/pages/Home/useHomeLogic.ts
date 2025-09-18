import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для логирования
const logSensorEvent = (event: string, details?: any) => {
  console.log(`[HomeSensor] ${event}`, details || '');
};

// Проверяем, находится ли приложение в Telegram
const isInTelegram = () => {
  return navigator.userAgent.includes('Telegram') || 
         window.Telegram?.WebApp?.initData !== undefined;
};

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    // В Telegram по умолчанию считаем, что разрешение есть
    if (isInTelegram() && (!saved || saved === "prompt")) {
      return "granted";
    }
    return saved || "prompt";
  });

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Функция для запроса разрешения
  const requestSensorPermission = useCallback(async () => {
    // В Telegram всегда даем разрешение автоматически
    if (isInTelegram()) {
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
      setSensorPermission("granted");
      logSensorEvent('permission_auto_granted_in_telegram');
      return;
    }

    setIsRequestingPermission(true);
    logSensorEvent('permission_request_started');
    
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        logSensorEvent('native_permission_api_available');
        
        const result = await (DeviceOrientationEvent as any).requestPermission();
        logSensorEvent('permission_result_received', { result });
        
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
        
        if (result === "granted") {
          logSensorEvent('permission_granted');
        } else {
          logSensorEvent('permission_denied');
        }
      } else {
        // На устройствах, где разрешение не требуется
        logSensorEvent('permission_not_required');
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      logSensorEvent('permission_error', { error: err });
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
      setSensorPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
      logSensorEvent('permission_request_completed');
    }
  }, []);

  const handleCompassClick = useCallback(() => {
    logSensorEvent('compass_clicked', { permission: sensorPermission });
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate, sensorPermission]);

  const handleMapClick = useCallback(() => {
    logSensorEvent('map_clicked');
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  // Функция для очистки localStorage при выходе
  const clearSensorPermission = useCallback(() => {
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    setSensorPermission("prompt");
    logSensorEvent('permission_cleared');
  }, []);

  return {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
    clearSensorPermission,
    isInTelegram: isInTelegram(),
  };
};