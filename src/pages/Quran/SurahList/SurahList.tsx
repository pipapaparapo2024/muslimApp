import React, { useEffect } from "react";
import styles from "./SurahList.module.css";
import { useSurahListStore } from "./SurahListStore";
import { PageWrapper } from "../../../shared/PageWrapper";
import quaran from "../../../assets/icons/quaran1.svg";
// import search from "../../../assets/icons/Search.svg";

export const SurahList: React.FC = () => {
  const { surahs, fetchSurahs, selectedSurah, setSelectedSurah } =
    useSurahListStore();

  useEffect(() => {
    fetchSurahs();
  }, [fetchSurahs]);

  return (
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <img src={quaran} alt="Quran" className={styles.quranImage} />
          <div className={styles.holyHeader}>
            <div className={styles.titleHeader}>
              <div className={styles.nameHoly}>Holy Quaran</div>
              <div className={styles.sahihInternational}>Sahih International ›</div>
            </div>
            <div className={styles.diskHeader}>Discover the Quran's 114 chapters</div>
          </div>
          
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search Chapters" 
            />
          </div>
        </div>
        
        <div className={styles.blockChapter}>
          {surahs.map((surah) => (
            <div
              key={surah.id}
              className={`${styles.surahItem} ${selectedSurah?.id === surah.id ? styles.selected : ""}`}
              onClick={() => setSelectedSurah(surah)}
            >
              <div className={styles.surahNumber}>{surah.id}.</div>
              <div className={styles.surahContent}>
                <div className={styles.surahName}>
                  {surah.englishName}
                </div>
                <div className={styles.surahDescription}>
                  
                </div>
                <div className={styles.surahDetails}>
                  <span className={styles.ayahs}>{surah.numberOfAyahs} Ayahs</span>
                  <span className={styles.revelationType}>
                    <span className={styles.searchIcon}>[🔍]</span> {surah.revelationType}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};