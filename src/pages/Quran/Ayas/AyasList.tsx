import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore, type Ayah } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { Search, Loader } from "lucide-react";
import { t } from "i18next";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScrollStore";

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
    searchAyahs,
    loadMoreAyahs,
    resetAyahs,
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Загрузка первых аятов
  useEffect(() => {
    const loadInitialAyahs = async () => {
      if (!surahId) return;

      try {
        resetAyahs();
        const initialAyahs = await fetchAyahs(surahId, 1);
        useSurahListStore.setState({ ayahs: initialAyahs });
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
      }
    };

    loadInitialAyahs();
  }, [surahId, fetchAyahs, resetAyahs]);

  // Обработчик поиска
  const handleSearch = useCallback(async () => {
    if (!surahId) return;

    setIsSearching(true);
    try {
      resetAyahs();
      
      if (localSearchQuery.trim()) {
        const searchResults = await searchAyahs(surahId, localSearchQuery.trim(), 1);
        useSurahListStore.setState({ 
          ayahs: searchResults,
          isSearchMode: true,
          searchQuery: localSearchQuery.trim(),
          hasMore: searchResults.length > 0
        });
      } else {
        // Если поисковой запрос пустой, загружаем обычные аяты
        const initialAyahs = await fetchAyahs(surahId, 1);
        useSurahListStore.setState({ 
          ayahs: initialAyahs,
          isSearchMode: false,
          searchQuery: "",
          hasMore: initialAyahs.length > 0
        });
      }
    } catch (err) {
      console.error("Error searching ayahs:", err);
    } finally {
      setIsSearching(false);
    }
  }, [surahId, localSearchQuery, searchAyahs, fetchAyahs, resetAyahs]);

  // Загрузка при скролле
  const loadMore = useCallback(() => {
    if (surahId && hasMore && !loading) {
      loadMoreAyahs(surahId);
    }
  }, [surahId, hasMore, loading, loadMoreAyahs]);

  // Infinite scroll hook
  const { observerTarget } = useInfiniteScroll(loadMore);

  // Обработчик отправки поиска
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

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
            <div className={styles.deskription}>{initialSurah?.description}</div>
          </div>
          
          {/* Поисковая строка */}
          <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
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
              {isSearching ? <Loader size={20} className={styles.spinner} /> : t("search")}
            </button>
          </form>
        </div>

        <div className={styles.ayatlist}>
          {ayahs.length === 0 && !loading ? (
            <div className={styles.noResults}>
              {localSearchQuery 
                ? t("noAyahsFoundFor") + ` "${localSearchQuery}"`
                : t("noAyahsAvailable")
              }
            </div>
          ) : (
            <>
              {ayahs.map((ayah: Ayah) => (
                <div key={ayah.number} className={styles.blockAyas}>
                  <div className={styles.ayasNember}>{ayah.number}</div>
                  <div className={styles.ayasText}>{ayah.text}</div>
                </div>
              ))}
              
              {/* Индикатор загрузки */}
              {loading && (
                <div className={styles.loadingContainer}>
                  <LoadingSpinner />
                </div>
              )}
              
              {/* Target для infinite scroll */}
              {hasMore && <div ref={observerTarget} className={styles.observerTarget} />}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};