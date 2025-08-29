import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import styles from "./QiblaMap.module.css";
import "leaflet/dist/leaflet.css";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { useMapStore } from "./QiblaMapStore";
import { useNavigate } from "react-router-dom";
import mekka from "../../../assets/icons/kaaba.svg";

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}
interface QiblaMapProps {
  fullscreen?: boolean;
  onMapClick?: () => void;
}

export const QiblaMap: React.FC<QiblaMapProps> = ({
  fullscreen = false,
  onMapClick,
}) => {
  const navigate = useNavigate();
  const { coords: geoCoords } = useGeoStore();
  const { setTempCoords } = useMapStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const kaabaMarkerRef = useRef<L.Marker | null>(null);
  const directionLineRef = useRef<L.Polyline | null>(null);
  const edgeKaabaMarkerRef = useRef<L.Marker | null>(null);
  const initializedRef = useRef(false);
  const currentCoordsRef = useRef(geoCoords || { lat: 0, lon: 0 });
  const [userHeading, setUserHeading] = useState<number>(0);

  // Стабильная утилита
  const createLatLng = useCallback(
    (lat: number, lng: number): L.LatLngExpression => [lat, lng],
    []
  );

  // Иконка пользователя с вращением
  const createUserIcon = useCallback((heading: number) => {
    return L.divIcon({
      html: `<div style="transform: rotate(${heading}deg); width: 27px; height: 27px; display: flex; align-items: center; justify-content: center;">
                  <svg width="50" height="50" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.69945 2.36418C7.25335 1.57065 7.92847 0.93061 8.89949 0.930634C9.87051 0.930636 10.5456 1.57065 11.0995 2.36418C11.6567 3.16239 12.2415 4.33732 12.9723 5.7989L14.6717 9.19702C15.2644 10.3824 15.7304 11.3131 16.021 12.0337C16.2951 12.7137 16.5007 13.4007 16.3386 14.0128C16.0947 14.934 15.3754 15.6534 14.4541 15.8973C13.8421 16.0594 13.155 15.8538 12.4751 15.5796C11.7545 15.2891 10.8238 14.823 9.63837 14.2303C9.21643 14.0193 9.12804 13.9828 9.04934 13.9672C8.95056 13.9477 8.84889 13.9471 8.75034 13.9665L8.74965 13.9672C8.67093 13.9828 8.58244 14.0194 8.16062 14.2303C6.97523 14.823 6.0445 15.2891 5.32391 15.5796C4.64395 15.8538 3.9569 16.0593 3.34484 15.8973C2.42363 15.6533 1.70428 14.934 1.46037 14.0128C1.29834 13.4008 1.50387 12.7137 1.77802 12.0337C2.06858 11.3131 2.53463 10.3824 3.12732 9.19702L4.82673 5.7989C5.55751 4.33733 6.14235 3.16239 6.69945 2.36418Z" fill="var(--bg-surface)" stroke="#15803D" stroke-width="1.5"/>
</svg>

               </div>`,
      className: "custom-user-icon",
      iconSize: [27, 27],
      iconAnchor: [13.5, 13.5],
    });
  }, []);

  // Иконка Каабы с белым фоном
  const createKaabaIcon = useCallback(() => {
    return L.divIcon({
      html: `<div style="
        width: 32px; 
        height: 32px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        border-radius: 50%;
        background-color: var(--bg-surface);
        box-shadow: 0 2px 6px var(--bg-surface);
      ">
        <img src="${mekka}" style="width: 32px; height: 32px;" />
      </div>`,
      className: "custom-kaaba-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  // Иконка Каабы на краю карты
  const createEdgeKaabaIcon = useCallback(() => {
    return L.divIcon({
      html: `<div style="
        width: 32px; 
        height: 32px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        border-radius: 50%;
        background-color: var(--bg-surface);
        box-shadow: 0 2px 6px var(--bg-surface);
      ">
        <img src="${mekka}" style="width: 20px; height: 20px;" />
      </div>`,
      className: "custom-edge-kaaba-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Обновление вращения маркера пользователя
  const updateUserMarkerRotation = useCallback(
    (heading: number) => {
      if (userMarkerRef.current) {
        const newIcon = createUserIcon(heading);
        userMarkerRef.current.setIcon(newIcon);
      }
    },
    [createUserIcon]
  );

  // Обновление линии направления и иконки Каабы на краю
  const updateDirectionLine = useCallback(() => {
    if (!leafletMapRef.current || !userMarkerRef.current) return;

    const userPos = userMarkerRef.current.getLatLng();
    const lat = userPos.lat;
    const lon = userPos.lng;

    // Обновляем линию
    if (directionLineRef.current) {
      directionLineRef.current.setLatLngs([
        [lat, lon],
        [KAABA_LAT, KAABA_LON],
      ]);
    }

    // Проверяем видимость Каабы для маркера на краю
    const mapBounds = leafletMapRef.current.getBounds();
    const kaabaVisible = mapBounds.contains([KAABA_LAT, KAABA_LON]);

    if (edgeKaabaMarkerRef.current && !kaabaVisible) {
      const map = leafletMapRef.current;
      const kaabaPoint = map.latLngToContainerPoint([KAABA_LAT, KAABA_LON]);
      const mapSize = map.getSize();
      const halfWidth = mapSize.x / 2;
      const halfHeight = mapSize.y / 2;
      const dx = kaabaPoint.x - halfWidth;
      const dy = kaabaPoint.y - halfHeight;

      let borderX, borderY;

      if (Math.abs(dx) / halfWidth > Math.abs(dy) / halfHeight) {
        borderX = dx > 0 ? mapSize.x - 20 : 20;
        borderY = halfHeight + ((borderX - halfWidth) * dy) / dx;
      } else {
        borderY = dy > 0 ? mapSize.y - 20 : 20;
        borderX = halfWidth + ((borderY - halfHeight) * dx) / dy;
      }

      borderX = Math.max(20, Math.min(mapSize.x - 20, borderX));
      borderY = Math.max(20, Math.min(mapSize.y - 20, borderY));

      const borderPoint = map.containerPointToLatLng([borderX, borderY]);
      edgeKaabaMarkerRef.current.setLatLng([borderPoint.lat, borderPoint.lng]);
      edgeKaabaMarkerRef.current.setOpacity(1);
    } else if (edgeKaabaMarkerRef.current) {
      edgeKaabaMarkerRef.current.setOpacity(0);
    }
  }, []);

  // Обновление элементов карты (позиция, вид, линия)
  const updateMapElements = useCallback(
    (lat: number, lon: number, updateView = true) => {
      if (!leafletMapRef.current) return;

      currentCoordsRef.current = { lat, lon };

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(createLatLng(lat, lon));
      }

      updateDirectionLine();

      if (updateView) {
        leafletMapRef.current.setView(
          createLatLng(lat, lon),
          leafletMapRef.current.getZoom()
        );
      }
    },
    [createLatLng, updateDirectionLine]
  );

  // Обработчик ориентации
  // Обработчик ориентации (ИСПРАВЛЕННЫЙ)
  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      // Приводим к кастомному типу для iOS
      const iosEvent = event as unknown as DeviceOrientationEventiOS;

      // Проверяем доступность данных компаса
      const hasStandardCompass = event.alpha !== null;
      const hasWebKitCompass = iosEvent.webkitCompassHeading !== undefined;

      if (!hasStandardCompass && !hasWebKitCompass) return;

      let newHeading: number;

      // Приоритет для webkitCompassHeading (более точный в iOS)
      if (hasWebKitCompass) {
        newHeading = iosEvent.webkitCompassHeading!;
      } else {
        // Стандартный способ для Android и других устройств
        newHeading = (event.alpha! + 360) % 360;
      }

      setUserHeading(newHeading);
      updateUserMarkerRotation(newHeading);
      localStorage.setItem("userHeading", newHeading.toString());
    },
    [updateUserMarkerRotation]
  );
  // === ОСНОВНОЙ ЭФФЕКТ: инициализация карты (один раз) ===
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    const displayCoords = geoCoords || { lat: 0, lon: 0 };

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoom: 10,
      maxZoom: 19,
      minZoom: 2,
    }).setView(createLatLng(displayCoords.lat, displayCoords.lon), 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Kaaba marker - всегда видимый
    kaabaMarkerRef.current = L.marker(createLatLng(KAABA_LAT, KAABA_LON), {
      icon: createKaabaIcon(),
    }).addTo(map);

    // User marker
    const initialHeading = parseFloat(
      localStorage.getItem("userHeading") || "0"
    );
    userMarkerRef.current = L.marker(
      createLatLng(displayCoords.lat, displayCoords.lon),
      {
        icon: createUserIcon(initialHeading),
        draggable: true,
      }
    ).addTo(map);

    // Direction line
    directionLineRef.current = L.polyline(
      [
        [displayCoords.lat, displayCoords.lon],
        [KAABA_LAT, KAABA_LON],
      ],
      {
        color: "#17823a",
        weight: 2,
        dashArray: "5, 10",
        opacity: 0.7,
      }
    ).addTo(map);

    // Edge Kaaba marker (initially hidden)
    edgeKaabaMarkerRef.current = L.marker(
      createLatLng(displayCoords.lat, displayCoords.lon),
      {
        icon: createEdgeKaabaIcon(),
        opacity: 0,
      }
    ).addTo(map);

    // Устанавливаем ссылки перед вызовом updateDirectionLine
    leafletMapRef.current = map;
    initializedRef.current = true;

    // Обновляем направление сразу после создания всех элементов
    updateDirectionLine();

    // Обновление при движении/зуме карты
    const handleMapMove = () => {
      updateDirectionLine();
    };

    map.on("moveend", handleMapMove);
    map.on("zoomend", handleMapMove);
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedCoords = { lat: e.latlng.lat, lon: e.latlng.lng };
      setTempCoords(clickedCoords);
      updateMapElements(clickedCoords.lat, clickedCoords.lon, true);
    });

    userMarkerRef.current.on("dragend", () => {
      const newPos = userMarkerRef.current!.getLatLng();
      const clickedCoords = { lat: newPos.lat, lon: newPos.lng };
      setTempCoords(clickedCoords);
      updateMapElements(clickedCoords.lat, clickedCoords.lon, true);
    });

    // Добавляем ориентацию
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off("moveend", handleMapMove);
        leafletMapRef.current.off("zoomend", handleMapMove);
        leafletMapRef.current.off("click");
        leafletMapRef.current.remove();
      }
      window.removeEventListener("deviceorientation", handleOrientation);

      userMarkerRef.current = null;
      kaabaMarkerRef.current = null;
      directionLineRef.current = null;
      edgeKaabaMarkerRef.current = null;
      leafletMapRef.current = null;
      initializedRef.current = false;
    };
  }, [
    createKaabaIcon,
    createEdgeKaabaIcon,
    createUserIcon,
    createLatLng,
    geoCoords,
    handleOrientation,
    setTempCoords,
    updateDirectionLine,
    updateMapElements,
  ]);

  // === Обновление при изменении geoCoords ===
  useEffect(() => {
    if (
      initializedRef.current &&
      geoCoords &&
      (geoCoords.lat !== currentCoordsRef.current.lat ||
        geoCoords.lon !== currentCoordsRef.current.lon)
    ) {
      updateMapElements(geoCoords.lat, geoCoords.lon, false);
    }
  }, [geoCoords, updateMapElements]);

  // === Обновление вращения маркера ===
  useEffect(() => {
    if (initializedRef.current && userMarkerRef.current) {
      updateUserMarkerRotation(userHeading);
    }
  }, [userHeading, updateUserMarkerRotation]);

  return (
    <div
      onClick={() => {
        if (fullscreen) return;
        if (onMapClick) {
          onMapClick();
        } else {
          navigate("/qibla");
        }
      }}
      ref={mapRef}
      className={fullscreen ? styles.fullscreen : styles.mapContainer}
    />
  );
};