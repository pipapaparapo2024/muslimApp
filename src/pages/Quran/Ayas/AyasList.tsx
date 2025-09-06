import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore, type Ayah } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { Search } from "lucide-react";
import { t } from "i18next";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah: initialSurah } = location.state || {};
  const { fetchAyahs, error } = useSurahListStore();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [surah, setSurah] = useState(initialSurah);

  useEffect(() => {
    const loadAyahs = async () => {
      if (!surahId) {
        setErr("Surah ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching ayahs for surah:", surahId);
        
        // Получаем аяты из API
        const ayahsData = await fetchAyahs(surahId);
        console.log("Received ayahs:", ayahsData);
        
        // Обновляем состояние с полученными аятами
        setAyahs(ayahsData);
        
        // Если сура была передана через state, обновляем ее с аятами
        if (initialSurah) {
          setSurah({
            ...initialSurah,
            ayahs: ayahsData
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading ayahs:", err);
        setErr(err instanceof Error ? err.message : "Failed to load ayahs");
        setLoading(false);
      }
    };

    loadAyahs();
  }, [surahId, fetchAyahs, initialSurah]);

  // Фильтрация аятов по поисковому запросу
  const filteredAyas = ayahs.filter((ayah: Ayah) =>
    ayah.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error || err) {
    return (
      <PageWrapper showBackButton navigateTo="/quran">
        <p> error {error}</p>
        <p> err {err}</p>
      </PageWrapper>
    );
  }

  if (loading) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton navigateTo="/quran">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <div className={styles.text}>
            <div className={styles.title}>{surah?.englishName || surah?.name}</div>
            <div className={styles.deskription}>{surah?.description}</div>
          </div>
          <div className={styles.searchContainer}>
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchChapters")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        <div className={styles.ayatlist}>
          {filteredAyas.length === 0 ? (
            <div className={styles.noResults}>
              {t("noChaptersFound")} "{searchQuery}"
            </div>
          ) : (
            filteredAyas.map((ayah: Ayah) => (
              <div key={ayah.number} className={styles.blockAyas}>
                <div className={styles.ayasNember}>{ayah.number}</div>
                <div className={styles.ayasText}>{ayah.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};