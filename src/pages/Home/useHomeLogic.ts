import { t } from "i18next";
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
  const requestSensorPermission = useCallback(async () => {
    // Если уже разрешено, ничего не делаем
    if (sensorPermission === "granted") {
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
        } else {
          // При отказе оставляем "prompt", чтобы можно было запросить снова
          setSensorPermission("prompt");
        }
      } else {
        // На устройствах, где разрешение не требуется
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
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
  const handleCompassClick = useCallback(async (currentPermission: string) => {
    if (currentPermission === "prompt") {
      // Если разрешение еще не запрашивалось, запрашиваем
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
            navigate("/qibla", { state: { activeTab: "compass" } });
          } else {
            // При отказе оставляем "prompt"
            setSensorPermission("prompt");
            alert(t("sensorPermissionRequired"));
          }
        } else {
          // На устройствах, где разрешение не требуется
          setSensorPermission("granted");
          navigate("/qibla", { state: { activeTab: "compass" } });
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        // При ошибке оставляем "prompt"
        setSensorPermission("prompt");
        alert(t("sensorPermissionError"));
      } finally {
        setIsRequestingPermission(false);
      }
    } else if (currentPermission === "granted") {
      // Если разрешение уже есть, просто переходим
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
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