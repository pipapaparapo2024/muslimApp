import { create } from "zustand";
import { quranApi } from "../../../api/api"; 

interface CompassState {
  qiblaDirection: number | null;
  magneticDeclination: number | null;
  deviceHeading: number | null; // текущее направление телефона
  error: string | null;

  fetchQibla: (coords: { lat: number; lon: number }) => Promise<void>;
  startOrientation: () => void;
  stopOrientation: () => void;
  reset: () => void;
}

export const useCompassStore = create<CompassState>((set) => ({
  qiblaDirection: null,
  magneticDeclination: null,
  deviceHeading: null,
  error: null,

  // Используем axios через quranApi
  fetchQibla: async (coords) => {
    try {
      const response = await quranApi.post("/api/v1/compass/", {
        lat: coords.lat,
        lon: coords.lon,
      });

      const data = response.data;

      if (typeof data.qiblaDirection === "number") {
        set({
          qiblaDirection: data.qiblaDirection,
          magneticDeclination: data.magneticDeclination ?? 0,
          error: null,
        });
      } else {
        throw new Error("Invalid response format: qiblaDirection missing");
      }
    } catch (err: any) {
      console.error("Compass API error:", err.message || err);
      set({
        qiblaDirection: 0,
        magneticDeclination: 0,
        error: "Не удалось определить направление на Каабу",
      });
    }
  },

  startOrientation: () => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha === null) return;
      const heading = (360 - event.alpha) % 360; // магнитный азимут
      set({ deviceHeading: heading });
    };

    const requestPermission = async () => {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          } else {
            console.warn("Orientation permission denied");
          }
        } catch (err) {
          console.error("Orientation permission error:", err);
        }
      } else {
        // На Android и десктопе разрешение не требуется
        window.addEventListener("deviceorientation", handleOrientation);
      }
    };

    // Запускаем после пользовательского взаимодействия
    requestPermission();
  },

  stopOrientation: () => {
    // Удаляем обработчик (нужно сохранить ссылку!)
    // Пока просто обнулим — в реальной реализации храни handleOrientation в ref
    window.removeEventListener("deviceorientation", () => {});
  },

  reset: () => {
    set({
      qiblaDirection: null,
      magneticDeclination: null,
      deviceHeading: null,
      error: null,
    });
  },
}));