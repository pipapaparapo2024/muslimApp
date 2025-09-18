import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SurahList.module.css";
import {
  useSurahListStore,
  type Surah,
} from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
import { ChevronDown, ChevronLeft, ChevronRight, Loader, Menu, Search } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { t } from "i18next";
export const SurahList: React.FC = () => {
  const navigate = useNavigate();
  const {
    surahs,
    fetchVariants,
    fetchSurahs,
    setSelectedSurah,
    selectedVariant,
    loading,
    error,
    surahsHasNext,
    isLoadingMore,
    loadMoreSurahs,
  } = useSurahListStore();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  useEffect(() => {
    if (selectedVariant) {
      fetchSurahs(selectedVariant.id);
    }
  }, [selectedVariant, fetchSurahs]);

  // Убираем форму и делаем поиск сразу при вводе
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Поиск происходит автоматически при изменении значения
  };

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSurahClick = (surah: Surah) => {
    setSelectedSurah(surah);
    navigate(`/quran/${surah.id}`, {
      state: { surah, variantId: selectedVariant?.id },
    });
  };
  const handleLoadMore = async () => {
    if (selectedVariant && surahsHasNext && !isLoadingMore) {
      try {
        await loadMoreSurahs(selectedVariant.id);
      } catch (err) {
        console.error("Error loading more surahs:", err);
      }
    }
  };
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

          {/* Убираем форму и делаем обычный input с onChange */}
          <div className={styles.searchContainer}>
            <Search size={20} strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchChapters")}
              value={searchQuery}
              onChange={handleSearchChange} // Изменено на handleSearchChange
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Ошибка */}
        {error && <div>Error: {error}</div>}

        <div className={styles.blockChapter}>
          {!loading && filteredSurahs.length === 0 ? (
            <div className={styles.noResults}>
              {t("noChaptersFound")} "{searchQuery}"
            </div>
          ) : (
            filteredSurahs.map((surah) => (
              <div
                key={surah.id}
                className={styles.surahItem}
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
                      <g clip-path="url(#clip0_1174_1025)">
                        <path
                          d="M15 1.66663L15.5148 2.69628C15.736 3.13876 15.8466 3.36 15.9945 3.55172C16.1255 3.72184 16.278 3.87435 16.4482 4.00549C16.6399 4.15327 16.8611 4.26389 17.3036 4.48513L18.3333 4.99996L17.3036 5.51478C16.8611 5.73603 16.6399 5.84665 16.4482 5.99443C16.278 6.12557 16.1255 6.27808 15.9945 6.4482C15.8466 6.63992 15.736 6.86116 15.5148 7.30364L15 8.33329L14.4851 7.30364C14.2639 6.86116 14.1533 6.63992 14.0055 6.4482C13.8744 6.27808 13.7219 6.12557 13.5517 5.99443C13.36 5.84665 13.1388 5.73603 12.6963 5.51478L11.6666 4.99996L12.6963 4.48513C13.1388 4.26389 13.36 4.15327 13.5517 4.00549C13.7219 3.87435 13.8744 3.72184 14.0055 3.55172C14.1533 3.36 14.2639 3.13876 14.4851 2.69628L15 1.66663Z"
                          stroke="var(--text)"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          stroke="var(--text)"
                          d="M17.5 11.1578C16.4075 13.0742 14.3454 14.3663 11.9815 14.3663C8.47588 14.3663 5.63392 11.5243 5.63392 8.01861C5.63392 5.65462 6.9262 3.59245 8.84288 2.5C4.81645 2.88177 1.66663 6.27243 1.66663 10.3988C1.66663 14.7809 5.21906 18.3333 9.60121 18.3333C13.7274 18.3333 17.1179 15.1838 17.5 11.1578Z"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
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
            ))
          )}
        </div>
      </div>
      {/* Кнопка загрузки следующих сур */}
      {surahsHasNext && !searchQuery && (
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
    </PageWrapper>
  );
};
