// Example Zustand store for Home page
import { create } from 'zustand';

interface HomeState {
  userCity: string | null;
  setUserCity: (city: string | null) => void;
  coords: { lat: number; lon: number } | null;
  setCoords: (coords: { lat: number; lon: number } | null) => void;
  geoRequested: boolean;
  setGeoRequested: (v: boolean) => void;
  geoAsked: boolean;
  setGeoAsked: (v: boolean) => void;
  geoError: string | null;
  setGeoError: (err: string | null) => void;
  fetchCity: (lat: number, lon: number) => void;
  getLocation: (tg: any) => void;
  requestLocationWithPopup: (tg: any) => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  userCity: null,
  setUserCity: (city) => set({ userCity: city }),
  coords: null,
  setCoords: (coords) => set({ coords }),
  geoRequested: false,
  setGeoRequested: (v) => set({ geoRequested: v }),
  geoAsked: false,
  setGeoAsked: (v) => set({ geoAsked: v }),
  geoError: null,
  setGeoError: (err) => set({ geoError: err }),
  fetchCity: (lat, lon) => {
    fetch(`/api/get-city?lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        if (typeof data === 'string') {
          set({ userCity: data });
          localStorage.setItem('user_city', data);
        } else if (data?.city) {
          set({ userCity: data.city });
          localStorage.setItem('user_city', data.city);
        }
      })
      .catch(() => set({ userCity: null }))
      .finally(() => set({ geoRequested: false }));
  },
  getLocation: (tg) => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.requestLocation) {
      window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number }) => {
        if (location) {
          set({ coords: { lat: location.latitude, lon: location.longitude } });
          localStorage.setItem('user_lat', String(location.latitude));
          localStorage.setItem('user_lon', String(location.longitude));
          get().fetchCity(location.latitude, location.longitude);
          set({ geoError: null });
        } else {
          set({ geoRequested: false, geoError: 'Геолокация не предоставлена.' });
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set({ coords: { lat: pos.coords.latitude, lon: pos.coords.longitude } });
          localStorage.setItem('user_lat', String(pos.coords.latitude));
          localStorage.setItem('user_lon', String(pos.coords.longitude));
          get().fetchCity(pos.coords.latitude, pos.coords.longitude);
          set({ geoError: null });
        },
        () => {
          set({ geoRequested: false, geoError: 'Геолокация не предоставлена.' });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      set({ geoRequested: false, geoError: 'Геолокация не поддерживается.' });
    }
  },
  requestLocationWithPopup: (tg) => {
    if (get().geoAsked) return;
    set({ geoRequested: true, geoAsked: true });
    tg.showPopup({
      title: 'Доступ к геолокации',
      message: 'Разрешить доступ к вашей геолокации для определения города?',
      buttons: [
        { type: 'ok', id: 'allow' },
        { type: 'cancel', id: 'cancel' }
      ]
    }, (buttonId: string) => {
      if (buttonId === 'allow') {
        get().getLocation(tg);
      } else {
        set({ geoRequested: false, geoError: 'Геолокация не предоставлена.' });
      }
    });
  },
})); 