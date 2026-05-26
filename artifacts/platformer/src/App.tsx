import { useState } from "react";
import Menu from "./pages/Menu";
import Game from "./pages/Game";

type AppView = "menu" | "playing";
type GameMode = "handmade" | "procedural";

export default function App() {
  const [view, setView] = useState<AppView>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("handmade");
  // Changing gameKey forces Game to fully remount (fresh state)
  const [gameKey, setGameKey] = useState(0);

  const handleStart = (mode: GameMode) => {
    setGameMode(mode);
    setGameKey((k) => k + 1);
    setView("playing");
  };

  const handleBackToMenu = () => {
    setView("menu");
  };

  const handlePlayEndless = () => {
    setGameMode("procedural");
    setGameKey((k) => k + 1);
    setView("playing");
  };

  if (view === "menu") {
    return <Menu onStart={handleStart} />;
  }

  return (
    <Game
      key={gameKey}
      mode={gameMode}
      onBackToMenu={handleBackToMenu}
      onPlayEndless={handlePlayEndless}
    />
  );
}
