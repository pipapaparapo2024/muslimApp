import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore, type Ayah } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { Search, Loader, ChevronDown } from "lucide-react";
import { t } from "i18next";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah: initialSurah } = location.state || {};

  const {
    ayahs,
    loading,
    error,
    hasMore,
    fetchAyahs,
    loadMoreAyahs,
    resetAyahs,
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSearching, ] = useState(false);

  // Загрузка первых аятов
  useEffect(() => {
    const loadInitialAyahs = async () => {
      if (!surahId) return;

      try {
        resetAyahs();
        const initialAyahs = await fetchAyahs(surahId, 1);
        useSurahListStore.setState({ ayahs: initialAyahs });

        // Проверяем, есть ли еще аяты для загрузки
        // Если в первой загрузке меньше 20 аятов - значит это последняя страница
        if (initialAyahs.length < 20) {
          useSurahListStore.setState({ hasMore: false });
        }
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
        useSurahListStore.setState({ hasMore: false });
      }
    };

    loadInitialAyahs();
  }, [surahId, fetchAyahs, resetAyahs]);

  // Загрузка дополнительных аятов
  const handleLoadMore = useCallback(async () => {
    if (!surahId || !hasMore || loading) return;

    try {
      await loadMoreAyahs(surahId);
    } catch (err) {
      console.error("Error loading more ayahs:", err);
    }
  }, [surahId, hasMore, loading, loadMoreAyahs]);

  if (error) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/quran">
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton navigateTo="/quran">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <div className={styles.text}>
            <div className={styles.title}>
              {initialSurah?.englishName || initialSurah?.name}
            </div>
            <div className={styles.deskription}>
              {initialSurah?.description}
            </div>
          </div>
          <form
            className={styles.searchContainer}
          >
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchInAyahs")}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader size={20} className={styles.spinner} />
              ) : (
                t("search")
              )}
            </button>
          </form>
        </div>

        <div className={styles.ayatlist}>
          {ayahs.length === 0 && !loading ? (
            <div className={styles.noResults}>{t("noAyahsAvailable")}</div>
          ) : (
            <>
              {ayahs.map((ayah: Ayah) => (
                <div key={ayah.number} className={styles.blockAyas}>
                  <div className={styles.ayasNember}>{ayah.number}</div>
                  <div className={styles.ayasText}>{ayah.text}</div>
                </div>
              ))}

              {/* Кнопка загрузки еще */}
              {hasMore && (
                <div className={styles.loadMoreContainer}>
                  <button
                    className={styles.loadMoreButton}
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader size={20} className={styles.spinner} />
                    ) : (
                      <>
                        <ChevronDown size={20} />
                        {t("loadMore")}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Сообщение о конце суры */}
              {!hasMore && ayahs.length > 0 && (
                <div className={styles.endOfSurah}>{t("endOfSurah")}</div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
