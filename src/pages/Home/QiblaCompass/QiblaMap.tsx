import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import styles from './QiblaMap.module.css';
import 'leaflet/dist/leaflet.css';
import { useQiblaCompassStore } from './QiblaCompassStore';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

interface QiblaMapProps {
  fullscreen?: boolean;
}

export const QiblaMap: React.FC<QiblaMapProps> = ({ fullscreen = false }) => {
  const {
    coords, setCoords,
    setTempCoords
  } = useQiblaCompassStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const kaabaMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    // Сначала пробуем взять координаты из localStorage
    const savedLat = localStorage.getItem('user_lat');
    const savedLon = localStorage.getItem('user_lon');
    if (savedLat && savedLon) {
      setCoords({ lat: Number(savedLat), lon: Number(savedLon) });
      return;
    }
    // Если нет — запрашиваем
    const getLocation = () => {
      if (window.Telegram?.WebApp?.requestLocation) {
        window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number } | null) => {
          if (location) {
            setCoords({
              lat: location.latitude,
              lon: location.longitude
            });
            localStorage.setItem('user_lat', String(location.latitude));
            localStorage.setItem('user_lon', String(location.longitude));
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setCoords({
                  lat: pos.coords.latitude,
                  lon: pos.coords.longitude
                });
                localStorage.setItem('user_lat', String(pos.coords.latitude));
                localStorage.setItem('user_lon', String(pos.coords.longitude));
              }
            );
          }
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude
            });
            localStorage.setItem('user_lat', String(pos.coords.latitude));
            localStorage.setItem('user_lon', String(pos.coords.longitude));
          }
        );
      }
    };
    getLocation();
  }, [setCoords]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;
    if (leafletMapRef.current) {
      leafletMapRef.current = null;
    }

    // Создаем карту с OpenStreetMap
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([coords.lat, coords.lon], 14);

    // Используем OpenStreetMap тайлы (бесплатно)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Добавляем маркер текущей локации
    const userMarker = L.marker([coords.lat, coords.lon]).addTo(map)
      .bindPopup('Your location')
      .openPopup();
    userMarkerRef.current = userMarker;

    // Добавляем маркер Каабы
    const kaabaMarker = L.marker([KAABA_LAT, KAABA_LON]).addTo(map)
      .bindPopup('Kaaba, Mecca');
    kaabaMarkerRef.current = kaabaMarker;

    // Добавляем линию направления на Каабу
    const latlngs = [
      [coords.lat, coords.lon],
      [KAABA_LAT, KAABA_LON]
    ];
    const line = L.polyline(latlngs, { color: '#17823a', weight: 3 }).addTo(map);
    lineRef.current = line;

    // В полноэкранном режиме добавляем обработчик кликов
    if (fullscreen) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedCoords = {
          lat: e.latlng.lat,
          lon: e.latlng.lng
        };
        setTempCoords(clickedCoords);
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([clickedCoords.lat, clickedCoords.lon]);
          userMarkerRef.current.setPopupContent('Selected location');
        }
        if (lineRef.current) {
          const newLatlngs = [
            [clickedCoords.lat, clickedCoords.lon],
            [KAABA_LAT, KAABA_LON]
          ];
          lineRef.current.setLatLngs(newLatlngs);
        }
      });
    }

    leafletMapRef.current = map;

    return () => {
      map.remove();
    };
  }, [coords, fullscreen, setTempCoords]);

  return <div ref={mapRef} className={fullscreen ? styles.fullscreen : styles.mapContainer} />;
};