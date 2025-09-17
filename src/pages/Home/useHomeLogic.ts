import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();

  // Состояние доступа к датчикам
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved === "granted" ? "granted" : "prompt";
  });

  // === ОБРАБОТКА TELEGRAM WEBAPP ===
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.MainButton.hide();
    tg.BackButton.hide();
    tg.enableClosingConfirmation();

    // Обработчик события закрытия приложения
    const handleClose = () => {
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
    };

    // 1. Событие onClosing (основной способ)
    tg.onClosing(handleClose);

    // 2. Дополнительно: отслеживаем изменение видимости (на случай сворачивания/разворачивания)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Приложение стало невидимым ( пользователь вышел )
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Очистка
    return () => {
      tg.offClosing(handleClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
          setSensorPermission("granted");
        } else {
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
          setSensorPermission("denied");
        }
      } else {
        window.addEventListener("deviceorientation", () => {}, { once: true });
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
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