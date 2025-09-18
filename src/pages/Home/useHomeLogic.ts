import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для определения платформы
const getPlatform = (): 'ios' | 'android' | 'other' => {
  const userAgent = navigator.userAgent || navigator.vendor;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'other';
};

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    setPlatform(getPlatform());
  }, []);

  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // === ИСПРАВЛЕННЫЙ ЗАПРОС ДОСТУПА К ДАТЧИКАМ ===
  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    
    try {
      // Проверяем, поддерживается ли API запроса разрешения (только iOS)
      if (platform === 'ios' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // Запрашиваем разрешение на iOS
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        
        if (permissionState === 'granted') {
          setSensorPermission("granted");
          console.log("Sensor permission granted on iOS");
          return "granted"; // Возвращаем результат
        } else {
          setSensorPermission("denied");
          console.log("Sensor permission denied on iOS");
          return "denied"; // Возвращаем результат
        }
      } else {
        // Для Android и других устройств разрешение не требуется
        setSensorPermission("granted");
        console.log("Sensor permission automatically granted for non-iOS");
        return "granted"; // Возвращаем результат
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
      return "denied"; // Возвращаем результат
    } finally {
      setIsRequestingPermission(false);
    }
  }, [platform]);

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ handleCompassClick
  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt") {
      // Если разрешение еще не запрашивалось, сначала запрашиваем
      const result = await requestSensorPermission();
      
      // Используем результат запроса, а не sensorPermission (который обновится позже)
      if (result === "granted") {
        navigate("/qibla", { state: { activeTab: "compass" } });
      }
    } else if (sensorPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, requestSensorPermission, navigate]);

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