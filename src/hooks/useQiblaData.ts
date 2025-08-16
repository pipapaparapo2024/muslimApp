// hooks/useQiblaData.ts
import { useEffect, useState } from 'react';
import { quranApi } from '../shared/api';
import { useAppStore } from '../pages/Home/GeoStore';

interface QiblaData {
  direction: number; // Направление на Киблу в градусах
  magneticDeclination: number; // Магнитное склонение
}

export const useQiblaData = () => {
  const { coords } = useAppStore();
  const [data, setData] = useState<QiblaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!coords) return;

      setLoading(true);
      setError(null);

      try {
        const response = await quranApi.post<QiblaData>(
          "/api/v1/compass",
          { lat: coords.lat, lon: coords.lon }
        );
        setData(response.data);
      } catch (err) {
        console.error("Ошибка получения данных Киблы", err);
        setError("Не удалось получить направление на Киблу");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coords]);

  return { data, loading, error };
};