// useHomeLogic.ts
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSensorPermission, logSensorEvent } from "../../hooks/useSensorPermission";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    isInTelegram
  } = useSensorPermission();

  const handleCompassClick = useCallback(() => {
    logSensorEvent('compass_clicked', { permission: sensorPermission });
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate, sensorPermission]);

  const handleMapClick = useCallback(() => {
    logSensorEvent('map_clicked');
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
    isInTelegram,
  };
};