import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { Search, Loader, ChevronDown, ChevronUp } from "lucide-react";
import { t } from "i18next";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah: initialSurah } = location.state || {};

  const {
    ayahs,
    error,
    hasNext,
    hasPrev,
    currentPage,
    pageAmount,
    fetchAyahs,
    loadMoreAyahs,
    loadPrevAyahs,
    resetAyahs,
    isLoadingMore,
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSearching] = useState(false);

  // Загрузка первых аятов
  useEffect(() => {
    const loadInitialAyahs = async () => {
      if (!surahId) return;

      try {
        resetAyahs();
        const response = await fetchAyahs(surahId, 1);
        
        useSurahListStore.setState({ 
          ayahs: response.ayahs,
          hasNext: response.hasNext,
          hasPrev: response.hasPrev,
          pageAmount: response.pageAmount
        });
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
        useSurahListStore.setState({ 
          hasNext: false,
          hasPrev: false 
        });
      }
    };

    loadInitialAyahs();
  }, [surahId, fetchAyahs, resetAyahs]);

  // Загрузка следующих аятов
  const handleLoadMore = useCallback(async () => {
    if (!surahId || !hasNext || isLoadingMore) return;

    try {
      await loadMoreAyahs(surahId);
    } catch (err) {
      console.error("Error loading more ayahs:", err);
    }
  }, [surahId, hasNext, isLoadingMore, loadMoreAyahs]);

  // Загрузка предыдущих аятов
  const handleLoadPrev = useCallback(async () => {
    if (!surahId || !hasPrev || isLoadingMore) return;

    try {
      await loadPrevAyahs(surahId);
    } catch (err) {
      console.error("Error loading previous ayahs:", err);
    }
  }, [surahId, hasPrev, isLoadingMore, loadPrevAyahs]);

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
    <PageWrapper showBackButton={true} navigateTo="/quran">
      <div className={styles.container}>
        <div className={styles.blockHeader}>
          <div className={styles.text}>
            <div className={styles.title}>
              {initialSurah?.englishName || initialSurah?.name}
            </div>
            <div className={styles.deskription}>
              {initialSurah?.description}
            </div>
            {pageAmount > 0 && (
              <div className={styles.pageInfo}>
                {t("page")} {currentPage} {t("of")} {pageAmount}
              </div>
            )}
          </div>
          <form className={styles.searchContainer}>
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
          {ayahs.length === 0 ? (
            <PageWrapper>
              <LoadingSpinner />
            </PageWrapper>
          ) : (
            <>
              {/* Кнопка загрузки предыдущих аятов */}
              {hasPrev && (
                <div className={styles.loadPrevContainer}>
                  <button
                    className={styles.loadMoreButton}
                    onClick={handleLoadPrev}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <Loader size={20} className={styles.spinner} />
                    ) : (
                      <>
                        <ChevronUp size={20} />
                        {t("loadPrevious")}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Список аятов */}
              {ayahs.map((ayah) => (
                <div key={ayah.number} className={styles.blockAyas}>
                  <div className={styles.ayasNember}>{ayah.number}</div>
                  <div className={styles.ayasText}>{ayah.text}</div>
                </div>
              ))}

              {/* Кнопка загрузки следующих аятов */}
              {hasNext && (
                <div className={styles.loadMoreContainer}>
                  <button
                    className={styles.loadMoreButton}
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
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
              {!hasNext && ayahs.length > 0 && (
                <div className={styles.endOfSurah}>{t("endOfSurah")}</div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};