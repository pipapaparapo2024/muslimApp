import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSensorPermission, logSensorEvent } from "../../hooks/useSensorPermission";
import { t } from "i18next";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    isInTelegram,
    checkSensorAvailability
  } = useSensorPermission();

  const [isSensorAvailable, setIsSensorAvailable] = useState(false);

  // Проверяем доступность датчиков при изменении разрешения
  useEffect(() => {
    if (sensorPermission === "granted") {
      checkSensorAvailability().then(available => {
        setIsSensorAvailable(available);
        console.log("Sensors available:", available);
      });
    } else {
      setIsSensorAvailable(false);
    }
  }, [sensorPermission, checkSensorAvailability]);

  const handleCompassClick = useCallback(() => {
    logSensorEvent('compass_clicked', { 
      permission: sensorPermission,
      available: isSensorAvailable 
    });
    
    if (sensorPermission !== "granted" || !isSensorAvailable) {
      // Показываем alert или модальное окно о необходимости разрешения
      alert(t("sensorPermissionRequiredAlert"));
      return;
    }
    
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate, sensorPermission, isSensorAvailable]);

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
    isSensorAvailable,
  };
};