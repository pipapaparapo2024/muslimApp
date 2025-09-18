import { useState, useEffect, useCallback } from 'react';

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Проверяем, является ли устройство iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Проверяем, требуется ли запрос разрешения
export const requiresPermission = () => {
  return isIOS() && 
         typeof DeviceOrientationEvent !== "undefined" && 
         (DeviceOrientationEvent as any).requestPermission;
};

export const useSensorPermission = () => {
  const [sensorPermission, setSensorPermission] = useState<string>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);

  // Загружаем статус из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    setSensorPermission(saved || 'prompt');
  }, []);

  // Сохраняем статус в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Функция запроса разрешения
  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      if (requiresPermission()) {
        // iOS - запрашиваем разрешение
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
      } else {
        // Android и другие устройства - разрешение не требуется
        setSensorPermission('granted');
      }
    } catch (err) {
      console.error('Sensor permission error:', err);
      setSensorPermission('denied');
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    sensorPermission,
    isRequesting,
    requestPermission,
    requiresPermission: requiresPermission(),
    isIOS: isIOS()
  };
};