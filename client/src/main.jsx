import React from "react";
import ReactDOM from "react-dom/client";
import "cm-chessboard/assets/styles/cm-chessboard.css";
import "cm-chessboard/src/cm-chessboard/extensions/arrows/assets/arrows.css";
import App from "./App.jsx";
import { registerServiceWorker } from "./pwa/registerServiceWorker.js";
import "./styles.css";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
