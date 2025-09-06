import { Routes, Route } from "react-router-dom";
import { useFriendsStore } from "./hooks/useFriendsStore";
import { useTheme } from "./hooks/useTheme";

import { Home } from "./pages/Home/Home";
import { Welcome } from "./pages/Welcome/Welcome";
import { Friends } from "./pages/Friends/Friends";
import { QnA } from "./pages/QnA/QnA";
import { Scanner } from "./pages/Scanner/Scanner";
import { Settings } from "./pages/Settings/Settings";
// import { SurahList } from "./pages/Quran/surahList/SurahList";
import { QiblaCompassPage } from "./pages/Home/qiblaCompassPage/QiblaCompassPage";
import { WelcomeFriends } from "./pages/Friends/WelcomeFriends";
import { useEffect } from "react";
import { useLanguage } from "./hooks/useLanguages";
import { Region } from "./pages/Settings/appSettings/region/Region";
import { DataTime } from "./pages/Settings/appSettings/dataTime/DataTime";
import { ModalTheme } from "./components/modals/modalSettings/ModalTheme";
import { SettingPrayerTimes } from "./pages/Settings/appSettings/settingPlayerTimes/SettingPrayerTimes";
import { HistoryDetail } from "./pages/QnA/history/historyDetail/HistoryDetail";
import { ModalLanguage } from "./components/modals/modalSettings/ModalLanguage";
import { History } from "./pages/QnA/history/History";
import { HistoryScanner } from "./pages/Scanner/historyScanner/HistoryScanner";

import { ShareStory } from "./pages/QnA/history/shareStory/ShareStory";
import { swipeBehavior, viewport } from "@telegram-apps/sdk"; // ← Импортируем из SDK
import { HistoryScannerDetail } from "./pages/Scanner/historyScanner/historyScannerDetail/HistoryScannerDetail";
import { PageWrapper } from "./shared/PageWrapper";
import { ScannerShareStory } from "./pages/Scanner/historyScanner/scannerShareStory/ScannerShareStory";
import { useGeoStore } from "./hooks/useGeoStore";
import { ScannerFlowManager } from "./pages/Scanner/ScannerFlowManager";
import { NotScaned } from "./pages/Scanner/notScaned/NotScaned";
import { AyahList } from "./pages/Quran/ayas/AyasList";
import { ChooseTranslation } from "./pages/Quran/translation/ChooseTranslation";

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
  const { friends, fetchFriends } = useFriendsStore();
  const { isThemeReady } = useTheme();
  const { isLanguageReady } = useLanguage();
  const { isInitialized: isGeoInitialized } = useGeoStore();
  const invitedCount = friends.filter(
    (friend) => friend.status === "invited" || friend.status === "purchased"
  ).length;
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
    fetchFriends();
  }, [fetchFriends]);

  // Показываем пустой экран до полной инициализации темы
  if (!isThemeReady || !isLanguageReady || !isGeoInitialized) {
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
        <Route
          path="/welcome-friends"
          element={invitedCount > 0 ? <Friends /> : <WelcomeFriends />}
        />
        <Route path="/friends" element={<Friends />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Welcome />} />
        {/* <Route path="/quran" element={<SurahList />} /> */}
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
        <Route  path="/quran/translation"element={<ChooseTranslation/>}/>
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
        <Route
          path="/scanner/scannerFlowManager "
          element={<ScannerFlowManager />}
        />
        <Route path="/scanner/notScanned" element={<NotScaned />} />
        <Route path="/qna" element={<QnA />} />
        <Route path="/qna/history" element={<History />} />
        <Route path="/qna/history/:id" element={<HistoryDetail />} />
        <Route path="/qna/shareHistory/:id" element={<ShareStory />} />
        <Route path="*" element={<PageWrapper>404 Not Found</PageWrapper>} />
      </Routes>
    </div>
  );
};
