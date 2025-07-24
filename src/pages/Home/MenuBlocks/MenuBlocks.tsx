import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuBlocks.module.css';

export const MenuBlocks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.menu}>
      <div className={styles.menuItem} onClick={() => navigate('/quran')}>
        <span className={styles.menuIcon} role="img" aria-label="quran">📖</span>
        <div className={styles.menuText}>
          <div className={styles.menuTitle}>Read Quran</div>
          <div className={styles.menuDesc}>Open and read the Holy Quran.</div>
        </div>
        <span className={styles.menuArrow}>›</span>
      </div>
      <div className={styles.menuItem} onClick={() => navigate('/qna')}>
        <span className={styles.menuIcon} role="img" aria-label="qna">🕌</span>
        <div className={styles.menuText}>
          <div className={styles.menuTitle}>Q&amp;A — Halal or Haram?</div>
          <div className={styles.menuDesc}>Ask if something is halal or haram.</div>
        </div>
        <span className={styles.menuArrow}>›</span>
      </div>
      <div className={styles.menuItem} onClick={() => navigate('/scanner')}>
        <span className={styles.menuIcon} role="img" aria-label="scanner">🍎</span>
        <div className={styles.menuText}>
          <div className={styles.menuTitle}>Product Scanner</div>
          <div className={styles.menuDesc}>Check if a product is halal by photo.</div>
        </div>
        <span className={styles.menuArrow}>›</span>
      </div>
      <div className={styles.menuItem} onClick={() => navigate('/friends')}>
        <span className={styles.menuIcon} role="img" aria-label="friends">🧑‍🤝‍🧑</span>
        <div className={styles.menuText}>
          <div className={styles.menuTitle}>Friends</div>
          <div className={styles.menuDesc}>Share the app for bonuses!</div>
        </div>
        <span className={styles.menuArrow}>›</span>
      </div>
      <div className={styles.menuItem} onClick={() => navigate('/settings')}>
        <span className={styles.menuIcon} role="img" aria-label="settings">⚙️</span>
        <div className={styles.menuText}>
          <div className={styles.menuTitle}>Settings</div>
          <div className={styles.menuDesc}>App preferences and language.</div>
        </div>
        <span className={styles.menuArrow}>›</span>
      </div>
    </div>
  );
}; 