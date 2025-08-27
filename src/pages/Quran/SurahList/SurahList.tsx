import React, { useEffect, useState } from "react";
import styles from "./SurahList.module.css";
import { useSurahListStore } from "./SurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
import { ChevronRight, Search } from "lucide-react";

export const SurahList: React.FC = () => {
  const { surahs, fetchSurahs, selectedSurah, setSelectedSurah } = useSurahListStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSurahs();
  }, [fetchSurahs]);

  // Фильтрация сур по названию (на английском)
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
                Sahih International <ChevronRight />
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
        </div>

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
                    {/* Можно добавить арабское название или перевод */}
                  </div>
                  <div className={styles.surahDetails}>
                    <span className={styles.ayahs}>{surah.numberOfAyahs} Ayahs</span>
                    <span className={styles.revelationType}>
                      {surah.revelationType === "Meccan" ? "مكة" : "مدنية"}
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