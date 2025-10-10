import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: [
            '> 1%',
            'last 2 versions', 
            'not dead',
            'iOS >= 9',
            'Android >= 4.4',
            'Chrome >= 49'
          ]
        })
      ]
    }
  },
  server: {
    host: true,
    allowedHosts: ["islamapp.myfavouritegames.org"],
  },
});