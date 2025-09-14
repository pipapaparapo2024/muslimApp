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
    ayahs = [],
    error,
    hasNext,
    fetchAyahs,
    loadMoreAyahs,
    resetAyahs,
    isLoadingMore,
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchNavigation, setShowSearchNavigation] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Поиск по уже загруженным аятам
  const searchInAyahs = useCallback(
    (query: string): number[] => {
      if (!query.trim() || ayahs.length === 0) return [];

      const searchTerm = query.toLowerCase();
      return ayahs
        .filter((ayah) => ayah.text.toLowerCase().includes(searchTerm))
        .map((ayah) => ayah.number);
    },
    [ayahs]
  );

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

  // Автоматический поиск при изменении запроса
  useEffect(() => {
    const handleSearch = async () => {
      if (!localSearchQuery.trim()) {
        setSearchResults([]);
        setCurrentResultIndex(-1);
        setShowSearchNavigation(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = searchInAyahs(localSearchQuery);
        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);
        setShowSearchNavigation(results.length > 0);
      } catch (err) {
        console.error("Error searching ayahs:", err);
        setSearchResults([]);
        setCurrentResultIndex(-1);
        setShowSearchNavigation(false);
      } finally {
        setIsSearching(false);
      }
    };

    // Добавляем debounce для избежания слишком частых поисков
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchInAyahs]);

  // Навигация по результатам поиска
  const navigateSearchResults = useCallback(
    (direction: "next" | "prev") => {
      if (searchResults.length === 0) return;

      let newIndex;
      if (direction === "next") {
        newIndex = (currentResultIndex + 1) % searchResults.length;
      } else {
        newIndex =
          (currentResultIndex - 1 + searchResults.length) %
          searchResults.length;
      }

      setCurrentResultIndex(newIndex);

      // Прокрутка к найденному элементу
      const resultNumber = searchResults[newIndex];
      const element = resultRefs.current.get(resultNumber);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Добавляем анимацию
        element.style.transform = "scale(1.02)";
        setTimeout(() => {
          if (element) {
            element.style.transform = "scale(1)";
          }
        }, 300);
      }
    },
    [searchResults, currentResultIndex]
  );

  // Обработка клавиш для навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearchNavigation && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          navigateSearchResults("next");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          navigateSearchResults("prev");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearchNavigation, searchResults, navigateSearchResults]);

  // Загрузка следующих аятов
  const handleLoadMore = useCallback(async () => {
    if (!surahId || !hasNext || isLoadingMore) return;

    try {
      await loadMoreAyahs(surahId);
    } catch (err) {
      console.error("Error loading more ayahs:", err);
    }
  }, [surahId, hasNext, isLoadingMore, loadMoreAyahs]);

  // Проверяем, является ли аят результатом поиска
  const isAyahInSearchResults = useCallback(
    (ayahNumber: number) => {
      return searchResults.includes(ayahNumber);
    },
    [searchResults]
  );

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

          <div
            ref={searchContainerRef}
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

            {showSearchNavigation && searchResults.length > 0 && (
              <div className={styles.searchNavigation}>
                <span className={styles.resultsCount}>
                  {currentResultIndex + 1}/{searchResults.length}
                </span>
                <button
                  type="button"
                  onClick={() => navigateSearchResults("prev")}
                  className={styles.navButton}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigateSearchResults("next")}
                  className={styles.navButton}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            )}

            {isSearching && (
              <Loader size={16} className={styles.searchSpinner} />
            )}
          </div>
        </div>

        {/* Содержимое аятов */}
        <div className={styles.ayatlist}>
          {error ? (
            <div className={styles.errorContainer}>
              <p>Error: {error}</p>
            </div>
          ) : ayahs.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Список аятов - всегда показываем все аяты */}
              {ayahs.map((ayah, index) => {
                const isSearchResult = isAyahInSearchResults(ayah.number);
                const isCurrentResult =
                  isSearchResult &&
                  searchResults[currentResultIndex] === ayah.number;

                return (
                  <div
                    key={ayah.number || index}
                    ref={(el) => {
                      if (el && ayah.number) {
                        resultRefs.current.set(ayah.number, el);
                      }
                    }}
                    className={`${styles.blockAyas} ${
                      isSearchResult ? styles.searchResult : ""
                    } ${isCurrentResult ? styles.highlightedResult : ""}`}
                    style={{
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <div className={styles.ayasNember}>{ayah.number}</div>
                    <div className={styles.ayasText}>{ayah.text}</div>
                  </div>
                );
              })}

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
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};