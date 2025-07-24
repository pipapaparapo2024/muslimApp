import React, { useState } from 'react';
import { QiblaMap } from '../QiblaCompass/QiblaMap';
import { QiblaCompass } from '../QiblaCompass/QiblaCompass';
import styles from './QiblaCompassPage.module.css';
import { PageWrapper } from '../../../shared/PageWrapper';

const CompassIcon = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="2" /><g><circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M11 7.5L13 13.5L11 11.5L9 13.5L11 7.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></g><path d="M7 19c2-1 6-1 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const MapIcon = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17c2-1 6-1 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="2" y="5" width="5" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="8.5" y="3" width="5" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="15" y="7" width="5" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

function useQiblaAngle() {
  const [angle, setAngle] = useState(0);
  React.useEffect(() => {
    let geoWatchId: number | null = null;
    let lastLat = 0;
    let lastLon = 0;
    function calculateQibla(lat: number, lon: number, heading: number) {
      const KAABA_LAT = 21.4225;
      const KAABA_LON = 39.8262;
      const toRad = (deg: number) => deg * (Math.PI / 180);
      const toDeg = (rad: number) => rad * (180 / Math.PI);
      const phiK = toRad(KAABA_LAT);
      const lambdaK = toRad(KAABA_LON);
      const phi = toRad(lat);
      const lambda = toRad(lon);
      const y = Math.sin(lambdaK - lambda);
      const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
      let theta = Math.atan2(y, x);
      theta = toDeg(theta);
      return (theta - heading + 360) % 360;
    }
    function onOrientation(e: DeviceOrientationEvent) {
      if (e.alpha !== null) {
        setAngle(Number(calculateQibla(lastLat, lastLon, e.alpha)));
      }
    }
    if (navigator.geolocation) {
      geoWatchId = navigator.geolocation.watchPosition(pos => {
        lastLat = pos.coords.latitude;
        lastLon = pos.coords.longitude;
      });
    }
    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      if (geoWatchId !== null) navigator.geolocation.clearWatch(geoWatchId);
    };
  }, []);
  return angle;
}

export const QiblaCompassPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compass' | 'map'>('compass');
  const angle = useQiblaAngle();

  return (
    <PageWrapper showBackButton>
      <div className={styles.wrapper}>
        <div className={styles.tabsWideRow}>
          <button
            className={`${styles.tabWide} ${activeTab === 'compass' ? styles.tabWideActive : ''}`}
            onClick={() => setActiveTab('compass')}
            style={{ minWidth: 0, width: '40%' }}
          >
            <span style={{ marginRight: 8 }}>{CompassIcon}</span> Compass
          </button>
          <button
            className={`${styles.tabWide} ${activeTab === 'map' ? styles.tabWideActive : ''}`}
            onClick={() => setActiveTab('map')}
            style={{ minWidth: 0, width: '40%' }}
          >
            <span style={{ marginRight: 8 }}>{MapIcon}</span> Map
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'compass' ? (
            <>
              <div className={styles.bigCompass}><QiblaCompass size={360} showAngle={true} /></div>
            </>
          ) : (
            <div className={styles.bigMap}><QiblaMap /></div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
