import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { PageWrapper } from "../../../shared/PageWrapper";
// import { useSurahListStore} from '../../../hooks/useSurahListStore'
import styles from "./AyasList.module.css"
export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  // const navigate = useNavigate();
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Получаем данные из состояния навигации
  const { surah, variantId } = location.state || {};

  useEffect(() => {
    const fetchAyahs = async () => {
      if (!surahId || !variantId) {
        setError("Missing surah ID or variant ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Здесь должен быть API вызов для получения аятов
        // const response = await quranApi.get(`/api/v1/quran/surah/${surahId}?varId=${variantId}`);
        // setAyahs(response.data.data.ayahs);
        
        // Временно заглушка
        setTimeout(() => {
          setAyahs(Array.from({ length: surah?.numberOfAyahs || 0 }, (_, i) => ({
            number: i + 1,
            text: `Ayah ${i + 1} text for surah ${surahId}`
          })));
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to load ayahs");
        setLoading(false);
      }
    };

    fetchAyahs();
  }, [surahId, variantId, surah]);

  if (error) {
    return (
      <PageWrapper showBackButton>
        <div className={styles.error}>{error}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{surah?.englishName || `Surah ${surahId}`}</h1>
          <p>{surah?.englishNameTranslation}</p>
          <div className={styles.surahInfo}>
            {surah?.revelationType} • {surah?.numberOfAyahs} Ayahs
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading ayahs...</div>
        ) : (
          <div className={styles.ayahsList}>
            {ayahs.map((ayah) => (
              <div key={ayah.number} className={styles.ayahItem}>
                <div className={styles.ayahNumber}>{ayah.number}</div>
                <div className={styles.ayahText}>{ayah.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};