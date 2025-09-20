import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSurahListStore } from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import styles from "./AyasList.module.css";
import { Search, Loader, ChevronDown, ChevronUp } from "lucide-react";
import { t } from "i18next";

export const AyahList: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const location = useLocation();
  const { surah: initialSurah } = location.state || {};

  const {
    ayahs,
    error,
    fetchAyahs,
    resetAyahs,
  } = useSurahListStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchNavigation, setShowSearchNavigation] = useState(false);

  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const loadInitialAyahs = async () => {
      if (!surahId) return;

      try {
        resetAyahs();
        await fetchAyahs(surahId);
      } catch (err) {
        console.error("Error loading initial ayahs:", err);
      }
    };

    loadInitialAyahs();
  }, [surahId, resetAyahs, fetchAyahs]);

  // Поиск по номерам аятов и тексту
  const searchInAyahs = useCallback(
    (query: string): number[] => {
      if (!query.trim() || ayahs.length === 0) return [];

      const searchTerm = query.toLowerCase();

      return ayahs
        .filter((ayah) => {
          const numberMatch = ayah.number.toString().includes(searchTerm);
          const textMatch = ayah.text.toLowerCase().includes(searchTerm);
          return numberMatch || textMatch;
        })
        .map((ayah) => ayah.number);
    },
    [ayahs]
  );

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

        if (results.length > 0) {
          const firstResult = results[0];
          const element = resultRefs.current.get(firstResult);
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              element.style.transform = "scale(1.02)";
              setTimeout(() => {
                if (element) {
                  element.style.transform = "scale(1)";
                }
              }, 300);
            }, 100);
          }
        }
      } catch (err) {
        console.error("Error searching ayahs:", err);
        setSearchResults([]);
        setCurrentResultIndex(-1);
        setShowSearchNavigation(false);
      } finally {
        setIsSearching(false);
      }
    };

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

      const resultNumber = searchResults[newIndex];
      const element = resultRefs.current.get(resultNumber);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        element.style.transform = "scale(1.02)";

        setTimeout(() => {
          if (element) {
            element.style.transform = "scale(1)";
            element.style.backgroundColor = "";
            element.style.color = "";
          }
        }, 1000);
      }
    },
    [searchResults, currentResultIndex]
  );

  // Обработка клавиш для навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearchNavigation && searchResults.length > 0) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
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

          <div className={styles.searchContainer}>
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchAyahs")}
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
                  disabled={searchResults.length <= 1}
                >
                  <ChevronUp color="var(--text)" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigateSearchResults("next")}
                  className={styles.navButton}
                  disabled={searchResults.length <= 1}
                >
                  <ChevronDown color="var(--text)" size={16} />
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
          {error && (
            <div className={styles.errorContainer}>
              <p>Error: {error}</p>
            </div>
          )}
          
          {/* Список аятов */}
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
                  transition: "all 0.3s ease",
                }}
              >
                <div className={styles.ayasNember}>{ayah.number}</div>
                <div className={styles.ayasText}>{ayah.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
};