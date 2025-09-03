import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore, mockAyahs } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { Search } from "lucide-react";
import { t } from "i18next";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah } = location.state || {};

  const { fetchAyahs } = useSurahListStore();

  const [, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadAyahs = async () => {
      if (!surahId) {
        setError("Surah ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching ayahs for surah:", surahId);
        const ayahsData = await fetchAyahs(surahId);
        console.log("Received ayahs:", ayahsData);
        setAyahs(ayahsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading ayahs:", err);
        setError(err instanceof Error ? err.message : "Failed to load ayahs");
        setLoading(false);
      }
    };

    loadAyahs();
  }, [surahId, fetchAyahs]);

  // if (error) {
  //   return (
  //     <PageWrapper showBackButton>
  //       <p>{error}</p>
  //     </PageWrapper>
  //   );
  // }
  if (loading)
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  const filteredAyas = mockAyahs.filter((ayah) =>
    ayah.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <PageWrapper showBackButton navigateTo="/quran">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <div className={styles.text}>
            <div className={styles.title}>{surah.englishName}</div>
            <div className={styles.deskription}>{surah.description}</div>
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
            filteredAyas.map((ayas) => (
              <div className={styles.blockAyas}>
                <div className={styles.ayasNember}>{ayas.number}</div>
                <div className={styles.ayasText}>{ayas.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
