// hooks/useDeviceOrientation.ts
import { useEffect, useState } from 'react';
import { useQiblaData } from './useQiblaData';

export const useDeviceOrientation = () => {
  const { data } = useQiblaData();
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!data) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // Корректировка с учетом магнитного склонения
        const correctedHeading = (360 - event.alpha + data.magneticDeclination) % 360;
        setHeading(correctedHeading);
      }
    };

    const requestPermission = async () => {
      try {
        // Для iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            setPermissionGranted(true);
          }
        } else {
          // Для других устройств
          window.addEventListener('deviceorientation', handleOrientation);
          setPermissionGranted(true);
        }
      } catch (err) {
        console.error('Ошибка доступа к датчикам', err);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [data]);

  return { heading, permissionGranted };
};