import React, { useEffect, useRef, useState, useCallback, use } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SurahList.module.css";
import {
  useSurahListStore,
  type Surah,
} from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader,
  Menu,
  Search,
  ArrowUp,
} from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { t } from "i18next";

export const SurahList: React.FC = () => {
  const navigate = useNavigate();
  const {
    surahs,
    fetchVariants,
    setSelectedSurah,
    selectedVariant,
    loading,
    error,
  } = useSurahListStore();
  const { language } = useLanguage();
  const [load,setLoad]=useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchNavigation, setShowSearchNavigation] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const getScrollButtonPosition = () => {
    return language === "ar" ? "5%" : "85%";
  };

  // Сортировка сур по номеру
  const sortedSurahs = React.useMemo(() => {
    return [...surahs].sort((a, b) => a.number - b.number);
  }, [surahs]);

  useEffect(() => {
    fetchVariants(); 
    setLoad(true)
  }, [fetchVariants]);

  // Обработчик скролла для показа/скрытия кнопки "Наверх"
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollToTop(scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Поиск по сурам
  const searchInSurahs = useCallback(
    (query: string): number[] => {
      if (!query.trim() || sortedSurahs.length === 0) return [];

      const searchTerm = query.toLowerCase();

      return sortedSurahs
        .filter((surah) => {
          const numberMatch = surah.number.toString().includes(searchTerm);
          const nameMatch = surah.name.toLowerCase().includes(searchTerm);
          const descriptionMatch = surah.description
            .toLowerCase()
            .includes(searchTerm);
          const placeMatch = surah.suraPlaceOfWriting
            .toLowerCase()
            .includes(searchTerm);
          const ayahsMatch = surah.numberOfAyahs
            .toString()
            .includes(searchTerm);

          return (
            numberMatch ||
            nameMatch ||
            descriptionMatch ||
            placeMatch ||
            ayahsMatch
          );
        })
        .map((surah) => surah.number);
    },
    [sortedSurahs]
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
        const results = searchInSurahs(localSearchQuery);
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
        console.error("Error searching surahs:", err);
        setSearchResults([]);
        setCurrentResultIndex(-1);
        setShowSearchNavigation(false);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchInSurahs]);

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

  const handleSurahClick = (surah: Surah) => {
    setSelectedSurah(surah);
    navigate(`/quran/${surah.id}`, {
      state: { surah, variantId: selectedVariant?.id },
    });
  };

  // Проверяем, является ли сура результатом поиска
  const isSurahInSearchResults = useCallback(
    (surahNumber: number) => {
      return searchResults.includes(surahNumber);
    },
    [searchResults]
  );

  return (
    <PageWrapper showBackButton={true} navigateTo="/home">
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <img src={quaran} alt="Quran" className={styles.quranImage} />
          <div className={styles.holyHeader}>
            <div className={styles.titleHeader}>
              <div className={styles.nameHoly}>{t("holyQuran")}</div>
              <div
                className={styles.sahihInternational}
                onClick={() => navigate("/quran/translation")}
              >
                {selectedVariant?.name}
                {language === "ar" ? (
                  <ChevronLeft size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </div>
            </div>
            <div className={styles.diskHeader}>{t("discoverChapters")}</div>
          </div>
          <div ref={searchContainerRef} className={styles.searchContainer}>
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchSurahs")}
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

        {/* Ошибка */}
        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.blockChapter}>
          {!load ? (
            <div className={styles.noResults}>{t("noChaptersFound")}</div>
          ) : (
            sortedSurahs.map((surah) => {
              const isSearchResult = isSurahInSearchResults(surah.number);
              const isCurrentResult =
                isSearchResult &&
                searchResults[currentResultIndex] === surah.number;

              return (
                <div
                  key={surah.id}
                  ref={(el) => {
                    if (el) {
                      resultRefs.current.set(surah.number, el);
                    }
                  }}
                  className={`${styles.surahItem} ${
                    isSearchResult ? styles.searchResult : ""
                  } ${isCurrentResult ? styles.highlightedResult : ""}`}
                  onClick={() => handleSurahClick(surah)}
                >
                  <div className={styles.blockNameNumber}>
                    <div className={styles.surahNumber}>{surah.number}</div>
                    <div className={styles.surahContent}>
                      <div className={styles.surahName}>{surah.name}</div>
                      <div className={styles.surahDescription}>
                        {surah.description}
                      </div>
                    </div>
                  </div>
                  <div className={styles.surahDetails}>
                    <div className={styles.blockDeskription}>
                      <Menu size={16} strokeWidth={2} />
                      <div className={styles.ayas}>
                        {surah.numberOfAyahs} {t("ayahs")}
                      </div>
                    </div>
                    <div className={styles.blockDeskription}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_1174_1025)">
                          <path
                            d="M15 1.66663L15.5148 2.69628C15.736 3.13876 15.8466 3.36 15.9945 3.55172C16.1255 3.72184 16.278 3.87435 16.4482 4.00549C16.6399 4.15327 16.8611 4.26389 17.3036 4.48513L18.3333 4.99996L17.3036 5.51478C16.8611 5.73603 16.6399 5.84665 16.4482 5.99443C16.278 6.12557 16.1255 6.27808 15.9945 6.4482C15.8466 6.63992 15.736 6.86116 15.5148 7.30364L15 8.33329L14.4851 7.30364C14.2639 6.86116 14.1533 6.63992 14.0055 6.4482C13.8744 6.27808 13.7219 6.12557 13.5517 5.99443C13.36 5.84665 13.1388 5.73603 12.6963 5.51478L11.6666 4.99996L12.6963 4.48513C13.1388 4.26389 13.36 4.15327 13.5517 4.00549C13.7219 3.87435 13.8744 3.72184 14.0055 3.55172C14.1533 3.36 14.2639 3.13876 14.4851 2.69628L15 1.66663Z"
                            stroke="var(--text)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            stroke="var(--text)"
                            d="M17.5 11.1578C16.4075 13.0742 14.3454 14.3663 11.9815 14.3663C8.47588 14.3663 5.63392 11.5243 5.63392 8.01861C5.63392 5.65462 6.9262 3.59245 8.84288 2.5C4.81645 2.88177 1.66663 6.27243 1.66663 10.3988C1.66663 14.7809 5.21906 18.3333 9.60121 18.3333C13.7274 18.3333 17.1179 15.1838 17.5 11.1578Z"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_1174_1025">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      {surah.suraPlaceOfWriting === "Makkah"
                        ? t("makkah")
                        : t("madinah")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {showScrollToTop && (
          <button
            className={styles.scrollToTopButton}
            onClick={scrollToTop}
            aria-label={t("scrollToTop")}
            style={{ left: getScrollButtonPosition() }}
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
