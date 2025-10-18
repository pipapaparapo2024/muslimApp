import { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

import "./styles/global.css";
import "./styles/languages.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
const manifestUrl = "https://islamapp.myfavouritegames.org/tonconnect.json"
ReactDOM.createRoot(document.getElementById("root")!).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </BrowserRouter>
  </TonConnectUIProvider>
);
