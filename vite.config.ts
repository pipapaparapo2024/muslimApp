import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
  },
  server: {
    host: true, // Для доступа с мобильных устройств в одной сети
    allowedHosts: [
      "b5608ad21f16.ngrok-free.app", // Разрешить ваш текущий домен ngrok
      ".ngrok-free.app",
      "islam_app.myfavouritegames.org", // Разрешить все поддомены ngrok (на случай перезапуска)
    ],
  },
});
