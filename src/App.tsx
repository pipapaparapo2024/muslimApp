import { useTelegram } from "./hooks/useTelegram";
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Welcome } from "./pages/Welcome";

function App() {
  const { tg } = useTelegram();

  return (
    <div className={tg.colorScheme === "dark" ? "dark-theme" : "light-theme"}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
