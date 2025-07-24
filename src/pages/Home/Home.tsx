import React, { useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import styles from './Home.module.css';
import { PageWrapper } from '../../shared/PageWrapper';
import { MenuBlocks } from './MenuBlocks/MenuBlocks';
import { PrayerTimes } from './PrayerTimes/PrayerTimes';
import { QiblaCompass } from './QiblaCompass/QiblaCompass';
import { useNavigate } from 'react-router-dom';
import { QiblaMap } from './QiblaCompass/QiblaMap';

export const Home: React.FC = () => {
  const { user, tg } = useTelegram();
  const navigate = useNavigate();
  const [city, setCity] = React.useState<string | null>(null);
  const [geoRequested, setGeoRequested] = React.useState(false);
  const [geoAsked, setGeoAsked] = React.useState(false);
  const [coords, setCoords] = React.useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  // При монтировании читаем город и координаты из localStorage
  React.useEffect(() => {
    const savedCity = localStorage.getItem('user_city');
    const savedLat = localStorage.getItem('user_lat');
    const savedLon = localStorage.getItem('user_lon');
    if (savedCity) setCity(savedCity);
    if (savedLat && savedLon) setCoords({ lat: Number(savedLat), lon: Number(savedLon) });
  }, []);

  const requestLocationWithPopup = () => {
    if (geoAsked) return;
    setGeoRequested(true);
    setGeoAsked(true);
    tg.showPopup({
      title: 'Доступ к геолокации',
      message: 'Разрешить доступ к вашей геолокации для определения города?',
      buttons: [
        { type: 'ok', id: 'allow' },
        { type: 'cancel', id: 'cancel' }
      ]
    }, (buttonId) => {
      if (buttonId === 'allow') {
        getLocation();
      } else {
        setGeoRequested(false);
        setGeoError('Геолокация не предоставлена.');
      }
    });
  };

  const getLocation = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.requestLocation) {
      window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number }) => {
        if (location) {
          setCoords({ lat: location.latitude, lon: location.longitude });
          localStorage.setItem('user_lat', String(location.latitude));
          localStorage.setItem('user_lon', String(location.longitude));
          fetchCity(location.latitude, location.longitude);
          setGeoError(null);
        } else {
          setGeoRequested(false);
          setGeoError('Геолокация не предоставлена.');
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          localStorage.setItem('user_lat', String(pos.coords.latitude));
          localStorage.setItem('user_lon', String(pos.coords.longitude));
          fetchCity(pos.coords.latitude, pos.coords.longitude);
          setGeoError(null);
        },
        () => {
          setGeoRequested(false);
          setGeoError('Геолокация не предоставлена.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setGeoRequested(false);
      setGeoError('Геолокация не поддерживается.');
    }
  };

  const fetchCity = (lat: number, lon: number) => {
    fetch(`/api/get-city?lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        if (typeof data === 'string') {
          setCity(data);
          localStorage.setItem('user_city', data);
        } else if (data?.city) {
          setCity(data.city);
          localStorage.setItem('user_city', data.city);
        }
      })
      .catch(() => setCity(null))
      .finally(() => setGeoRequested(false));
  };

  React.useEffect(() => {
    // Запрашиваем геолокацию только если нет города и координат в localStorage
    if (user && !city && !coords && !geoRequested && !geoAsked) {
      const timer = setTimeout(requestLocationWithPopup, 1000);
      return () => clearTimeout(timer);
    }
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
          <div onClick={() => navigate('/qibla')} style={{ cursor: 'pointer' }}>
            <div className={styles.qiblaBlockRow}>
              <QiblaMap />
              <QiblaCompass size={170} />
            </div>
          </div>
        </div>
        <MenuBlocks />
      </div>
    </PageWrapper>
  );
};

