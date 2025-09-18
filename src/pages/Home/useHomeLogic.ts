import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // === ОБЩАЯ ФУНКЦИЯ ДЛЯ ЗАПРОСА ДОСТУПА ===
  const requestSensorPermission = useCallback(async (onSuccess?: () => void) => {
    // Если уже разрешено, ничего не делаем
    if (sensorPermission === "granted") {
      onSuccess?.();
      return;
    }
    
    setIsRequestingPermission(true);
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
          onSuccess?.();
        } else {
          // При отказе оставляем "prompt"
          setSensorPermission("prompt");
        }
      } else {
        // На устройствах, где разрешение не требуется
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
        onSuccess?.();
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      // При ошибке оставляем "prompt"
      setSensorPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
    }
  }, [sensorPermission]);

  // Навигация с проверкой разрешения
  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "granted") {
      // Если разрешение уже есть, просто переходим
      navigate("/qibla", { state: { activeTab: "compass" } });
    } else {
      // Запрашиваем разрешение и переходим после успеха
      requestSensorPermission(() => {
        navigate("/qibla", { state: { activeTab: "compass" } });
      });
    }
  }, [navigate, sensorPermission, requestSensorPermission]);

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