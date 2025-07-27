import React from 'react';
import { usePrayerTimesStore } from './PrayerTimesStore';
import styles from './PrayerTimes.module.css';

// import editIcon from '../../assets/react.svg';

export const PrayerTimes: React.FC = () => {
  const { prayerTimes, nextPrayer } = usePrayerTimesStore();

  return (
    <div className={styles.prayerTimesContainer}>
      <div className={styles.headerRow}>
        <span className={styles.title}>Prayer Times</span>
        <span className={styles.editIcon}><img src={""} alt="Edit" style={{ width: 18, height: 18, opacity: 0.5 }} /></span>
      </div>
      <div className={styles.subtitle}>
        View today’s Salah times and upcoming prayers.
      </div>
      <div className={styles.grid}>
        {prayerTimes.map((prayer, idx) => (
          <div
            key={idx}
            className={
              styles.prayerCard +
              (prayer.isDisabled ? ' ' + styles.disabled : '')
            }
          >
            {prayer.isNext && (
              <div className={styles.nextBadge}>In 5 Min</div>
            )}
            <div>{prayer.name}</div>
            <div style={{ fontSize: '1.1em', fontWeight: 400, marginTop: 2 }}>{prayer.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
  