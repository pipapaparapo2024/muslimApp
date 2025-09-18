// hooks/useSensorPermission.ts
import { useState, useCallback, useEffect } from "react";

export const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Общая функция проверки Telegram
export const isInTelegram = () => {
  return navigator.userAgent.includes('Telegram') || 
         window.Telegram?.WebApp?.initData !== undefined;
};

// Функция для логирования
export const logSensorEvent = (event: string, details?: any) => {
  console.log(`[Sensor] ${event}`, details || '');
};

export const useSensorPermission = () => {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
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

  // Функция для проверки реальной доступности датчиков
  const checkSensorAvailability = useCallback(async (): Promise<boolean> => {
    if (isInTelegram()) {
      return true; // В Telegram всегда доступно
    }

    if (sensorPermission !== "granted") {
      return false;
    }

    // Проверяем реальную доступность датчиков
    try {
      if (typeof DeviceOrientationEvent === "undefined") {
        return false;
      }

      // Добавляем временную обработку события для проверки
      return new Promise((resolve) => {
        const handler = () => {
          window.removeEventListener('deviceorientation', handler as any);
          resolve(true);
        };
        
        window.addEventListener('deviceorientation', handler as any, { once: true });
        
        // Таймаут на случай если событие не придет
        setTimeout(() => resolve(false), 1000);
      });
    } catch (error) {
      logSensorEvent('sensor_check_failed', { error });
      return false;
    }
  }, [sensorPermission]);

  const requestSensorPermission = useCallback(async () => {
    if (isInTelegram()) {
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
      setSensorPermission("granted");
      logSensorEvent('permission_auto_granted_in_telegram');
      return "granted";
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
        
        return result;
      } else {
        // На устройствах, где разрешение не требуется
        logSensorEvent('permission_not_required');
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
        return "granted";
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      logSensorEvent('permission_error', { error: err });
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
      setSensorPermission("prompt");
      return "prompt";
    } finally {
      setIsRequestingPermission(false);
      logSensorEvent('permission_request_completed');
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