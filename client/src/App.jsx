import { useState } from "react";
import { GameScreen } from "./components/GameScreen.jsx";
import { SetupScreen } from "./components/SetupScreen.jsx";
import {
  clearSession,
  getAppearance,
  getSavedSession,
  saveAppearance,
  saveSession,
} from "./utils/storage.js";

export default function App() {
  const [session, setSession] = useState(getSavedSession);
  const [appearance, setAppearance] = useState(getAppearance);

  function handleStart(nextSession) {
    saveSession(nextSession);
    setSession(nextSession);
  }

  function handleSessionChange(nextSession) {
    saveSession(nextSession);
    setSession(nextSession);
  }

  function handleNewGame() {
    clearSession();
    setSession(null);
  }

  function handleAppearanceChange(nextAppearance) {
    saveAppearance(nextAppearance);
    setAppearance(nextAppearance);
    if (session) {
      const nextSession = { ...session, appearance: nextAppearance };
      saveSession(nextSession);
      setSession(nextSession);
    }
  }

  return session ? (
    <GameScreen
      key={session.id}
      session={session}
      appearance={appearance}
      onAppearanceChange={handleAppearanceChange}
      onSessionChange={handleSessionChange}
      onNewGame={handleNewGame}
    />
  ) : (
    <SetupScreen appearance={appearance} onStart={handleStart} />
  );
}
