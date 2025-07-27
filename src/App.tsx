import { useTelegram } from "./hooks/useTelegram";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import { Welcome } from "./pages/Welcome/Welcome";
import { Friends } from "./pages/Friends/Friends";
import { QnA } from "./pages/QnA/QnA";
import { Scanner } from "./pages/Scanner/Scanner";
import { Settings } from "./pages/Settings/Settings";
import { SurahList } from "./pages/Quran/SurahList";
import { QiblaCompassPage } from "./pages/Home/QiblaCompassPage/QiblaCompassPage";
import { WelcomeFriends } from "./pages/Friends/WelcomeFriends";
import React from "react";


export const App: React.FC = () => {
  const { tg } = useTelegram();

  return (
    <div className={tg.colorScheme === "dark" ? "dark-theme" : "light-theme"}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/friends-welcome" element={<WelcomeFriends />} />
        <Route path="/qna" element={<QnA />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/quran" element={<SurahList />} />
        <Route path="/qibla" element={<QiblaCompassPage />} />
      </Routes>
    </div>
  );
}

