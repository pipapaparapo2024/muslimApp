import React, { useEffect, useRef } from "react";
import L from "leaflet";
import styles from "./QiblaMap.module.css";
import "leaflet/dist/leaflet.css";
import { useGeoStore } from "../GeoStore";
import { useMapStore } from "./QiblaMapStore";
import { useNavigate } from "react-router-dom";
import navigationArrowMaps from "../../../assets/icons/navigationArrowMaps.svg";
import mekka from "../../../assets/icons/kaaba.svg";

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

interface QiblaMapProps {
  fullscreen?: boolean;
  onMapClick?: () => void;
}

export const QiblaMap: React.FC<QiblaMapProps> = ({
  fullscreen = false,
  onMapClick,
}) => {
  const navigate = useNavigate();
  const { coords } = useGeoStore();
  const { setTempCoords } = useMapStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const kaabaMarkerRef = useRef<L.Marker | null>(null);
  const initializedRef = useRef(false);

  const createLatLng = (lat: number, lng: number): L.LatLngExpression => [
    lat,
    lng,
  ];

  const userIcon = new L.Icon({
    iconUrl: navigationArrowMaps,
    iconSize: [27, 27],
    iconAnchor: [16, 16],
  });

  const kaabaIcon = new L.Icon({
    iconUrl: mekka,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const updateMapElements = (lat: number, lon: number) => {
    if (!leafletMapRef.current) return;

    // Обновляем позицию пользователя
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(createLatLng(lat, lon));
    }

    // Центрируем карту на пользователе
    leafletMapRef.current.setView(
      createLatLng(lat, lon),
      leafletMapRef.current.getZoom()
    );
  };

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    const displayCoords = coords || { lat: 0, lon: 0 };
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

    // Kaaba marker с кастомной иконкой
    kaabaMarkerRef.current = L.marker(createLatLng(KAABA_LAT, KAABA_LON), {
      icon: kaabaIcon,
    }).addTo(map);

    // User marker
    userMarkerRef.current = L.marker(
      createLatLng(displayCoords.lat, displayCoords.lon),
      {
        icon: userIcon,
        draggable: true,
      }
    ).addTo(map);

    // Handle map click
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedCoords = {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      };
      setTempCoords(clickedCoords);
      updateMapElements(clickedCoords.lat, clickedCoords.lon);
    });

    // Handle marker drag
    userMarkerRef.current.on("dragend", (e) => {
      const marker = e.target;
      const newPos = marker.getLatLng();
      const clickedCoords = {
        lat: newPos.lat,
        lon: newPos.lng,
      };
      setTempCoords(clickedCoords);
      updateMapElements(clickedCoords.lat, clickedCoords.lon);
    });

    leafletMapRef.current = map;
    initializedRef.current = true;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        userMarkerRef.current = null;
        kaabaMarkerRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [coords, fullscreen, setTempCoords]);

  useEffect(() => {
    if (initializedRef.current && coords) {
      updateMapElements(coords.lat, coords.lon);
    }
  }, [coords]);

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