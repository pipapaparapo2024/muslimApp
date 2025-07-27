import React, { useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import styles from './Home.module.css';
import { PageWrapper } from '../../shared/PageWrapper';
import { MenuBlocks } from './MenuBlocks/MenuBlocks';
import { PrayerTimes } from './PrayerTimes/PrayerTimes';
import { QiblaCompass } from './QiblaCompass/QiblaCompass';
import { useNavigate } from 'react-router-dom';
import { QiblaMap } from './QiblaCompass/QiblaMap';
import { useHomeStore } from './HomeStore';

export const Home: React.FC = () => {
  const { user, tg } = useTelegram();
  const navigate = useNavigate();
  const {
    userCity: city,
    setUserCity,
    coords,
    setCoords,
    geoRequested,
    geoAsked,
    geoError,
    requestLocationWithPopup
  } = useHomeStore();

  // При монтировании читаем город и координаты из localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('user_city');
    const savedLat = localStorage.getItem('user_lat');
    const savedLon = localStorage.getItem('user_lon');
    if (savedCity) setUserCity(savedCity);
    if (savedLat && savedLon) setCoords({ lat: Number(savedLat), lon: Number(savedLon) });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Запрашиваем геолокацию только если нет города и координат в localStorage
    if (user && !city && !coords && !geoRequested && !geoAsked) {
      const timer = setTimeout(() => requestLocationWithPopup(tg), 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [user, city, coords, geoRequested, geoAsked]);

  // Header/close logic for Home
  useEffect(() => {
    tg.setHeaderColor('#ffffff');
    tg.MainButton.hide();
    tg.BackButton.hide();
    tg.enableClosingConfirmation();
  }, [tg]);

  let mapContent: React.ReactNode | null = null;
  if (coords) {
    const lat = coords.lat;
    const lon = coords.lon;
    // Yandex Static Maps (no API key required)
    const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=300,120&z=13&l=map&pt=${lon},${lat},pm2rdm`;
    mapContent = (
      <div style={{ margin: '18px auto 0 auto', maxWidth: 320, borderRadius: 22, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <img src={mapUrl} alt="Map" style={{ width: '100%', display: 'block', borderRadius: 22 }} />
      </div>
    );
  } else if (geoError) {
    mapContent = (
      <div style={{ margin: '18px auto 0 auto', maxWidth: 320, color: 'red', fontWeight: 600, fontSize: 18, textAlign: 'center', border: '2px dashed red', borderRadius: 16, padding: 18 }}>
        {geoError}
      </div>
    );
  }

  return (
    <PageWrapper>
      {user && (
        <div className={styles.userInfo}>
          <img
            src={user.photo_url}
            alt={user.first_name}
            className={styles.userAvatar}
          />
          <span className={styles.userName}>
            {user.first_name}{user.last_name ? `, ${user.last_name}` : ''}{city ? `, ${city}` : ''}
          </span>
          {geoRequested && <span className={styles.geoLoading}>...</span>}
        </div>
      )}
      <div className={styles.homeContent}>
        <PrayerTimes />
        <div className={styles.qiblaBlock}>
          <div>
            <div className={styles.qiblaBlockRow}>
              <QiblaMap />
              <QiblaCompass size={170} onClick={() => navigate('/qibla')} />
            </div>
          </div>
        </div>
        <MenuBlocks />
      </div>
    </PageWrapper>
  );
};

