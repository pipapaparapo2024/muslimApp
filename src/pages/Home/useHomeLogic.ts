import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Проверяем, является ли устройство iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Проверяем, требуется ли запрос разрешения
const requiresPermission = () => {
  return isIOS() && 
         typeof DeviceOrientationEvent !== "undefined" && 
         (DeviceOrientationEvent as any).requestPermission;
};

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Функция запроса разрешения
  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      if (requiresPermission()) {
        // iOS - запрашиваем разрешение
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
      } else {
        // Android и другие устройства - разрешение не требуется
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  // Обработка клика на компас
  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt" && requiresPermission()) {
      // iOS - нужно запросить разрешение
      setIsRequestingPermission(true);
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
        
        if (result === "granted") {
          navigate("/qibla", { state: { activeTab: "compass" } });
        } else {
          alert(t("sensorPermissionRequired"));
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        setSensorPermission("denied");
        alert(t("sensorPermissionError"));
      } finally {
        setIsRequestingPermission(false);
      }
    } else {
      // Разрешение уже есть или не требуется
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, navigate]);

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