import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SurahList.module.css";
import {
  useSurahListStore,
  type Surah,
} from "../../../hooks/useSurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useLanguage } from "../../../hooks/useLanguages";
import { t } from "i18next";
export const SurahList: React.FC = () => {
  const navigate = useNavigate();
  const {
    surahs,
    fetchVariants,
    fetchSurahs,
    setSelectedSurah,
    variants,
    selectedVariant,
    setSelectedVariant,
    loading,
    error,
  } = useSurahListStore();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  useEffect(() => {
    // После загрузки вариантов загружаем суры для выбранного варианта
    if (selectedVariant) {
      fetchSurahs(selectedVariant.id);
    }
  }, [selectedVariant, fetchSurahs]);

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.englishNameTranslation
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleSurahClick = (surah: Surah) => {
    setSelectedSurah(surah);
    // Переход на страницу аятов с передачей параметров
    navigate(`/quran/${surah.id}`, {
      state: {
        surah,
        variantId: selectedVariant?.id,
      },
    });
  };

  const handleVariantChange = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <img src={quaran} alt="Quran" className={styles.quranImage} />
          <div className={styles.holyHeader}>
            <div className={styles.titleHeader}>
              <div className={styles.nameHoly}>{t("holyQuran")}</div>
              <div className={styles.sahihInternational}>
                {selectedVariant?.name}{" "}
                {language === "ar" ? (
                  <ChevronLeft size={24} />
                ) : (
                  <ChevronRight size={24} />
                )}
              </div>
            </div>
            <div className={styles.diskHeader}>
              {t("discoverChapters")}
            </div>
          </div>

          <div className={styles.searchContainer}>
            <Search strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder={t("searchChapters")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Выбор варианта перевода */}
          {variants.length > 0 && (
            <div className={styles.variantSelector}>
              <label className={styles.variantLabel}>{t("translation")}</label>
              <select
                value={selectedVariant?.id || ""}
                onChange={(e) => handleVariantChange(e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && <div className={styles.error}>Error: {error}</div>}

        {/* Загрузка */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            {t("loadingChapters")}
          </div>
        )}

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
                <div className={styles.surahNumber}>{surah.id}.</div>
                <div className={styles.surahContent}>
                  <div className={styles.surahName}>{surah.englishName}</div>
                  <div className={styles.surahDescription}>
                    {surah.englishNameTranslation}
                  </div>
                  <div className={styles.surahDetails}>
                    <span className={styles.ayahs}>
                      {surah.numberOfAyahs} {t("ayahs")}
                    </span>
                    <span className={styles.revelationType}>
                      {surah.revelationType === "Makkah" ? "مكة" : "مدينة"}
                    </span>
                  </div>
                </div>
                {language === "ar" ? (
                  <ChevronLeft size={24} />
                ) : (
                  <ChevronRight size={24} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
