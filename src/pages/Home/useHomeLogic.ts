import { t } from "i18next";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSensorPermission } from "../../hooks/useSensorPermission";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const { sensorPermission, isRequesting, requestPermission, requiresPermission } = useSensorPermission();

  // Обработка клика на компас
  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt" && requiresPermission) {
      // iOS - нужно запросить разрешение
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result === "granted") {
          navigate("/qibla", { state: { activeTab: "compass" } });
        } else {
          alert(t("sensorPermissionRequired"));
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        alert(t("sensorPermissionError"));
      }
    } else {
      // Разрешение уже есть или не требуется
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, requiresPermission, navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission: isRequesting,
    requestSensorPermission: requestPermission,
    handleCompassClick,
    handleMapClick,
  };
};