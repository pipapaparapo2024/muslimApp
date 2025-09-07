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
    fetchAyahs,
    loadMoreAyahs,
    loadPrevAyahs,
    resetAyahs,
    isLoadingMore,
    searchAyahs,
    searchQuery, // Получаем текущий поисковый запрос из хранилища
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");

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
          pageAmount: response.pageAmount,
          searchQuery: "", // Сбрасываем поисковый запрос при загрузке суры
        });
        setLocalSearchQuery(""); // Сбрасываем локальное состояние поиска
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
        useSurahListStore.setState({
          hasNext: false,
          hasPrev: false,
        });
      }
    };

    loadInitialAyahs();
  }, [surahId, fetchAyahs, resetAyahs]);

  // Обработчик поиска
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surahId) return;

    try {
      await searchAyahs(surahId, localSearchQuery);
    } catch (err) {
      console.error("Error searching ayahs:", err);
    }
  }, [surahId, localSearchQuery, searchAyahs]);

  // Обработчик сброса поиска
  const handleClearSearch = useCallback(async () => {
    if (!surahId || !localSearchQuery) return;

    setLocalSearchQuery("");
    try {
      await searchAyahs(surahId, ""); // Пустой запрос сбросит поиск
    } catch (err) {
      console.error("Error clearing search:", err);
    }
  }, [surahId, localSearchQuery, searchAyahs]);

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
            {/* Показываем информацию о поиске */}
            {searchQuery && (
              <div className={styles.searchInfo}>
                {t("searchResultsFor")}: "{searchQuery}"
              </div>
            )}
          </div>
          <form className={styles.searchContainer} onSubmit={handleSearch}>
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchInAyahs")}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.clearSearchButton}
                title={t("clearSearch")}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className={styles.searchButton}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader size={20} className={styles.spinner} />
              ) : (
                t("search")
              )}
            </button>
          </form>
        </div>

        <div className={styles.ayatlist}>
          {ayahs.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Кнопка загрузки предыдущих аятов */}
              {hasPrev && (
                <div className={styles.loadMoreContainer}>
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

              {/* Сообщение о конце результатов поиска */}
              {searchQuery && !hasNext && ayahs.length > 0 && (
                <div className={styles.endOfSearch}>
                  {t("endOfSearchResults")}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};