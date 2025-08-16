// src/pages/Home/Home.tsx
import React, { useEffect } from "react";
// import { useUserStore } from "../../api/useUserSlice";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { QiblaMap } from "./QiblaCompass/QiblaMap";

import { useGeoStore } from "./GeoStore";
import { useCompassStore } from "./QiblaCompass/QiblaCompassStore";
import { Header } from "../../components/Header";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useUserStore();

  // src/pages/Home/Home.tsx
  const {
    coords,
    city,
    country,
    isLoading,
    error,
    isInitialized,
    fetchFromIpApi,
  } = useGeoStore();
  const { fetchQibla } = useCompassStore();
  useEffect(() => {
    // Ждём, пока persist загрузит данные
    if (isInitialized && !coords && !isLoading && !error) {
      fetchFromIpApi();
    }
  }, [isInitialized, coords, isLoading, error, fetchFromIpApi]);
  // Запрос разрешений на сенсоры (для компаса)
  useEffect(() => {
    const permissionsRequested = localStorage.getItem(
      "sensorPermissionsRequested"
    );
    if (permissionsRequested) return;

    const handleFirstInteraction = () => {
      if ((DeviceOrientationEvent as any)?.requestPermission) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .catch(() => {})
          .finally(() => {
            localStorage.setItem("sensorPermissionsRequested", "1");
          });
      } else {
        localStorage.setItem("sensorPermissionsRequested", "1");
      }

      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("click", handleFirstInteraction, { once: true });
  }, []);

  // Пересчитываем направление на Каабу
  useEffect(() => {
    if (coords) {
      fetchQibla(coords);
    }
  }, [coords, fetchQibla]);

  // Telegram UI
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.MainButton.hide();
      tg.BackButton.hide();
      tg.enableClosingConfirmation();
    }
  }, []);

  const handleCompassClick = () =>
    navigate("/qibla", { state: { activeTab: "compass" } });
  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  return (
    <PageWrapper>
      <Header
        city={city || "Unknown city"}
        country={country?.name || "Unknown country"}
      />
      <div className={styles.homeRoot}>
        {/* Показываем лоадер или ошибку */}
        {isLoading && !coords && (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            Определяем ваше местоположение...
          </div>
        )}

        {error && !coords && (
          <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
            Не удалось определить местоположение
          </div>
        )}

        {!isLoading && (coords || city) && (
          <div className={styles.prayerTimesQiblaContainer}>
            <PrayerTimes />
            <div className={styles.qiblaBlock}>
              <div className={styles.titleFaceKaaba}>Face the Kaaba</div>
              <div className={styles.diskFaceKaaba}>
                Use the map to align yourself correctly for Salah.
              </div>
              <div className={styles.qiblaBlockRow}>
                <div onClick={handleMapClick}>
                  <QiblaMap />
                </div>
                <div onClick={handleCompassClick}>
                  <QiblaCompass />
                </div>
              </div>
            </div>
          </div>
        )}

        <MenuBlocks />
      </div>
    </PageWrapper>
  );
};

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// interface IpData {
//   success: boolean;
//   ip: string;
//   type: string;
//   country: {
//     code: string;
//     name: string;
//   };
//   location: {
//     lat: number;
//     lon: number;
//   };
//   timeZone: string;
//   asn: {
//     number: number;
//     name: string;
//     network: string;
//   };
// }

// export const Home: React.FC = () => {
//   const [ipData, setIpData] = useState<IpData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchIpData = async () => {
//       try {
//         const response = await axios.get<IpData>('https://api.my-ip.io/v2/ip.json  ');
//         setIpData(response.data);
//         setLoading(false);
//       } catch (err) {
//         setError('Failed to fetch IP data');
//         setLoading(false);
//         console.error('Error fetching IP data:', err);
//       }
//     };

//     fetchIpData();
//   }, []);

//   if (loading) {
//     return <div>Loading IP information...</div>;
//   }

//   if (error) {
//     return <div className="text-red-500">{error}</div>;
//   }

//   if (!ipData) {
//     return <div>No IP data available</div>;
//   }

//   return (
//     <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-xl font-bold mb-4 text-center">IP Information</h2>

//       <div className="space-y-3">
//         <div className="flex justify-between">
//           <span className="font-medium">IP Address:</span>
//           <span>{ipData.ip} ({ipData.type})</span>
//         </div>

//         <div className="flex justify-between">
//           <span className="font-medium">Country:</span>
//           <span>{ipData.country.name} ({ipData.country.code})</span>
//         </div>

//         <div className="flex justify-between">
//           <span className="font-medium">Location:</span>
//           <span>
//             Lat: {ipData.location.lat.toFixed(3)}, Lon: {ipData.location.lon.toFixed(3)}
//           </span>
//         </div>

//         <div className="flex justify-between">
//           <span className="font-medium">Time Zone:</span>
//           <span>{ipData.timeZone}</span>
//         </div>

//         <div className="pt-3 border-t">
//           <h3 className="font-medium mb-2">ASN Information:</h3>
//           <div className="space-y-2 pl-4">
//             <div className="flex justify-between">
//               <span>Number:</span>
//               <span>{ipData.asn.number}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Name:</span>
//               <span>{ipData.asn.name}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Network:</span>
//               <span>{ipData.asn.network}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
