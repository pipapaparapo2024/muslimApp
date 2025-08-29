import React, { useEffect, useState } from "react";
import styles from "./SurahList.module.css";
import { useSurahListStore } from "./SurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
import { ChevronRight, Search } from "lucide-react";

export const SurahList: React.FC = () => {
  const {
    surahs,
    fetchVariants,
    fetchSurahs,
    selectedSurah,
    setSelectedSurah,
    variants,
    selectedVariant,
    setSelectedVariant,
    loading,
    error,
  } = useSurahListStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVariants(); // Сначала получаем варианты
  }, []);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]); // Автоматически выбираем первый вариант
    }
  }, [variants, selectedVariant, setSelectedVariant]);

  useEffect(() => {
    if (selectedVariant) {
      fetchSurahs(); // После выбора варианта — загружаем сур
    }
  }, [selectedVariant, fetchSurahs]);

  const filteredSurahs = surahs.filter((surah) =>
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <img src={quaran} alt="Quran" className={styles.quranImage} />
          <div className={styles.holyHeader}>
            <div className={styles.titleHeader}>
              <div className={styles.nameHoly}>Holy Quran</div>
              <div className={styles.sahihInternational}>
                {selectedVariant?.name} <ChevronRight />
              </div>
            </div>
            <div className={styles.diskHeader}>Discover the Quran's 114 chapters</div>
          </div>

          <div className={styles.searchContainer}>
            <Search strokeWidth={1.5} color="var(--desk-text)" />
            <input
              type="text"
              placeholder="Search Chapters"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Выбор варианта перевода */}
          {variants.length > 0 && (
            <div className={styles.variantSelector}>
              <label>Translation:</label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = variants.find(v => v.id === e.target.value);
                  if (variant) setSelectedVariant(variant);
                }}
                className={styles.select}
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
        {error && (
          <div className={styles.error}>
            Error: {error}
          </div>
        )}

        {/* Загрузка */}
        {loading && <div className={styles.loading}>Loading...</div>}

        <div className={styles.blockChapter}>
          {filteredSurahs.length === 0 ? (
            <div className={styles.surahItem}>No chapters found</div>
          ) : (
            filteredSurahs.map((surah) => (
              <div
                key={surah.id}
                className={`${styles.surahItem} ${selectedSurah?.id === surah.id ? styles.selected : ""}`}
                onClick={() => setSelectedSurah(surah)}
              >
                <div className={styles.surahNumber}>{surah.id}.</div>
                <div className={styles.surahContent}>
                  <div className={styles.surahName}>{surah.englishName}</div>
                  <div className={styles.surahDescription}>
                    {surah.englishNameTranslation}
                  </div>
                  <div className={styles.surahDetails}>
                    <span className={styles.ayahs}>{surah.numberOfAyahs} Ayahs</span>
                    <span className={styles.revelationType}>
                      {surah.revelationType === 'Makkah' ? 'مكة' : 'مدنية'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};