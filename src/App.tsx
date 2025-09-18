import { Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";

import { Home } from "./pages/Home/Home";
import { Welcome } from "./pages/Welcome/Welcome";
import { Friends } from "./pages/Friends/Friends";
import { QnA } from "./pages/QnA/QnA";
import { Scanner } from "./pages/Scanner/Scanner";
import { Settings } from "./pages/Settings/Settings";
import { SurahList } from "./pages/Quran/SurahList/SurahList";
import { QiblaCompassPage } from "./pages/Home/QiblaCompassPage/QiblaCompassPage";
import { WelcomeFriends } from "./pages/Friends/WelcomeFriends";
import { useEffect } from "react";
import { Region } from "./pages/Settings/appSettings/region/Region";
import { DataTime } from "./pages/Settings/appSettings/dataTime/DataTime";
import { ModalTheme } from "./components/modals/modalSettings/ModalTheme";
import { SettingPrayerTimes } from "./pages/Settings/appSettings/settingPlayerTimes/SettingPrayerTimes";
import { HistoryDetail } from "./pages/QnA/History/historyDetail/HistoryDetail";
import { ModalLanguage } from "./components/modals/modalSettings/ModalLanguage";
import { History } from "./pages/QnA/History/History";
import { HistoryScanner } from "./pages/Scanner/HistoryScanner/HistoryScanner";

import { ShareStory } from "./pages/QnA/History/shareStory/ShareStory";
import { swipeBehavior, viewport } from "@telegram-apps/sdk"; // ← Импортируем из SDK
import { HistoryScannerDetail } from "./pages/Scanner/HistoryScanner/historyScannerDetail/HistoryScannerDetail";
import { PageWrapper } from "./shared/PageWrapper";
import { ScannerShareStory } from "./pages/Scanner/HistoryScanner/scannerShareStory/ScannerShareStory";
import { useGeoStore } from "./hooks/useGeoStore";
import { ScannerFlowManager } from "./pages/Scanner/ScannerFlowManager";
import { NotScaned } from "./pages/Scanner/notScaned/NotScaned";
import { AyahList } from "./pages/Quran/Ayas/AyasList";
import { ChooseTranslation } from "./pages/Quran/translation/ChooseTranslation";
import { AnalyzingPromise } from "./pages/QnA/analyzingPromis/AnalyzingPromise";
import { CameraPage } from "./pages/Scanner/cameraPage/CameraPage";
// Настройка полноэкранного режима и предотвращение свайпа
if (viewport.expand.isAvailable()) {
  viewport.expand();
}

if (swipeBehavior.mount.isAvailable()) {
  swipeBehavior.mount();
  if (swipeBehavior.disableVertical.isAvailable()) {
    swipeBehavior.disableVertical();
  }
}

export const App: React.FC = () => {
  const { isThemeReady } = useTheme();
  const { isInitialized: isGeoInitialized } = useGeoStore();
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      // Запрещаем поворот экрана
      window.Telegram.WebApp.disableVerticalSwipes();
    }
  }, []);
  useEffect(() => {
    const initializeApp = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();

        // Дополнительная защита от свайпа
        if (typeof tg.enableClosingConfirmation === "function") {
          tg.enableClosingConfirmation();
        }
        if (typeof tg.disableVerticalSwipes === "function") {
          tg.disableVerticalSwipes();
        }
      }
    };

    initializeApp();
  }, []);

  // Показываем пустой экран до полной инициализации темы
  if (!isThemeReady || !isGeoInitialized) {
    return (
      <div
        style={{
          height: "100vh",
          background: "var(--bg-app)",
          transition: "background-color 0.3s ease",
        }}
      />
    );
  }
  return (
    <div>
      <Routes>
        <Route path="/welcomeFriends" element={<WelcomeFriends />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Welcome />} />
        <Route path="/quran" element={<SurahList />} />
        <Route path="/quran/:surahId" element={<AyahList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/region" element={<Region />} />
        <Route path="/settings/language" element={<ModalLanguage />} />
        <Route path="/settings/dateTime" element={<DataTime />} />
        <Route path="/settings/prayerTimes" element={<SettingPrayerTimes />} />
        <Route path="/settings/theme" element={<ModalTheme />} />
        <Route path="/qibla" element={<QiblaCompassPage />} />
        <Route
          path="/privacy-policy"
          element={<div>Privacy Policy Page</div>}
        />
        <Route path="/scanner/camera" element={<CameraPage />} />
        <Route path="/quran/translation" element={<ChooseTranslation />} />
        <Route path="/terms-of-use" element={<div>Terms of Use Page</div>} />
        <Route path="/contact-us" element={<div>Contact Us Page</div>} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/scanner/historyScanner" element={<HistoryScanner />} />
        <Route
          path="/scanner/historyScanner/:id"
          element={<HistoryScannerDetail />}
        />
        <Route path="/scanner/analyze" element={<ScannerFlowManager />} />
        <Route
          path="/scanner/ScannerShareHistory/:id"
          element={<ScannerShareStory />}
        />

        <Route path="/scanner/notScanned" element={<NotScaned />} />
        <Route path="/qna" element={<QnA />} />
        <Route path="/qna/analyzing" element={<AnalyzingPromise />} />
        <Route path="/qna/history" element={<History />} />
        <Route path="/qna/history/:id" element={<HistoryDetail />} />
        <Route path="/qna/shareHistory/:id" element={<ShareStory />} />
        <Route path="*" element={<PageWrapper>404 Not Found</PageWrapper>} />
      </Routes>
    </div>
  );
};
