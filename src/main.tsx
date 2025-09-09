import "./api/i18n";
import { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

import "./styles/global.css";
import "./styles/languages.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </BrowserRouter>
);
