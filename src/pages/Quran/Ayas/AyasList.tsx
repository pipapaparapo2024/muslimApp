import React, { useEffect, useState, useCallback, useRef } from "react";
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
    fetchAyahs,
    loadMoreAyahs,
    resetAyahs,
    isLoadingMore,
    searchAyahs, // Используем реальную функцию поиска из хранилища
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchNavigation, setShowSearchNavigation] = useState(false);

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Загрузка первых аятов
  useEffect(() => {
    const loadInitialAyahs = async () => {
      if (!surahId) return;

      try {
        resetAyahs();
        const response = await fetchAyahs(surahId, 1);

        if (response && response.ayahs) {
          useSurahListStore.setState({
            ayahs: response.ayahs,
            hasNext: response.hasNext,
            hasPrev: response.hasPrev,
            pageAmount: response.pageAmount,
          });
        }
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
        useSurahListStore.setState({
          hasNext: false,
          hasPrev: false,
          ayahs: [],
        });
      }
    };

    loadInitialAyahs();
  }, [surahId, fetchAyahs, resetAyahs]);

  // Поиск аятов - используем реальную функцию из хранилища
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!surahId || !localSearchQuery.trim()) return;

      setIsSearching(true);
      try {
        // Используем реальную функцию поиска из хранилища
        await searchAyahs(surahId, localSearchQuery);
        
        // После поиска показываем навигацию если есть результаты
        const hasResults = ayahs.length > 0;
        setCurrentResultIndex(hasResults ? 0 : -1);
        setShowSearchNavigation(hasResults);
        
      } catch (err) {
        console.error("Error searching ayahs:", err);
        setCurrentResultIndex(-1);
        setShowSearchNavigation(false);
      } finally {
        setIsSearching(false);
      }
    },
    [surahId, localSearchQuery, searchAyahs, ayahs.length]
  );

  // Навигация по результатам поиска
  const navigateSearchResults = useCallback((direction: 'next' | 'prev') => {
    if (ayahs.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % ayahs.length;
    } else {
      newIndex = (currentResultIndex - 1 + ayahs.length) % ayahs.length;
    }

    setCurrentResultIndex(newIndex);

    // Прокрутка к найденному элементу
    const result = ayahs[newIndex];
    const element = resultRefs.current.get(result.number);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Добавляем анимацию
      element.style.transform = 'scale(1.02)';
      setTimeout(() => {
        if (element) {
          element.style.transform = 'scale(1)';
        }
      }, 300);
    }
  }, [ayahs, currentResultIndex]);

  // Обработка клавиш для навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearchNavigation && ayahs.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateSearchResults('next');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateSearchResults('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchNavigation, ayahs, navigateSearchResults]);

  // Сброс поиска при изменении запроса
  useEffect(() => {
    if (!localSearchQuery.trim()) {
      // При очистке поиска загружаем первые аяты снова
      if (surahId) {
        resetAyahs();
        fetchAyahs(surahId, 1);
      }
      setCurrentResultIndex(-1);
      setShowSearchNavigation(false);
    }
  }, [localSearchQuery, surahId, resetAyahs, fetchAyahs]);

  // Загрузка следующих аятов
  const handleLoadMore = useCallback(async () => {
    if (!surahId || !hasNext || isLoadingMore) return;

    try {
      await loadMoreAyahs(surahId);
    } catch (err) {
      console.error("Error loading more ayahs:", err);
    }
  }, [surahId, hasNext, isLoadingMore, loadMoreAyahs]);

  return (
    <PageWrapper showBackButton={true} navigateTo="/quran">
      <div className={styles.container}>
        {/* Header всегда отображается */}
        <div className={styles.blockHeader}>
          <div className={styles.text}>
            <div className={styles.title}>
              {initialSurah?.englishName || initialSurah?.name || t("surah")}
            </div>
            {initialSurah?.description && (
              <div className={styles.deskription}>
                {initialSurah.description}
              </div>
            )}
          </div>
          
          <form 
            ref={searchContainerRef}
            className={styles.searchContainer} 
            onSubmit={handleSearch}
          >
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchInAyahs")}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            
            {showSearchNavigation && ayahs.length > 0 && (
              <div className={styles.searchNavigation}>
                <span className={styles.resultsCount}>
                  {currentResultIndex + 1}/{ayahs.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSearchResults('prev');
                  }}
                  className={styles.navButton}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSearchResults('next');
                  }}
                  className={styles.navButton}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            )}
            
            {isSearching && (
              <Loader size={16} className={styles.searchSpinner} />
            )}
          </form>
        </div>

        {/* Содержимое аятов */}
        <div className={styles.ayatlist}>
          {error ? (
            <div className={styles.errorContainer}>
              <p>Error: {error}</p>
            </div>
          ) : ayahs.length === 0 ? (
            localSearchQuery ? (
              <div className={styles.noResults}>
                {t("noResultsFound")}
              </div>
            ) : (
              <LoadingSpinner />
            )
          ) : (
            <>
              {/* Список аятов */}
              {ayahs.map((ayah, index) => (
                <div
                  key={ayah.number || index}
                  ref={(el) => {
                    if (el && ayah.number) {
                      resultRefs.current.set(ayah.number, el);
                    }
                  }}
                  className={`${styles.blockAyas} ${
                    showSearchNavigation && index === currentResultIndex 
                      ? styles.highlightedResult 
                      : ''
                  }`}
                  style={{
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <div className={styles.ayasNember}>{ayah.number}</div>
                  <div className={styles.ayasText}>{ayah.text}</div>
                </div>
              ))}

              {/* Кнопка загрузки следующих аятов (только если не в режиме поиска) */}
              {hasNext && !localSearchQuery && (
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
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};