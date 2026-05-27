import { useState } from "react";
import Menu from "./pages/Menu";
import Game from "./pages/Game";
import LevelEditor from "./pages/LevelEditor";

type AppView = "menu" | "playing" | "editor";
type GameMode = "handmade" | "procedural" | "custom";

export default function App() {
  const [view, setView] = useState<AppView>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("handmade");
  const [gameKey, setGameKey] = useState(0);
  const [customLevelString, setCustomLevelString] = useState<string>("");

  const handleStart = (mode: "handmade" | "procedural") => {
    setGameMode(mode);
    setGameKey((k) => k + 1);
    setView("playing");
  };

  const handleBackToMenu = () => setView("menu");

  const handlePlayEndless = () => {
    setGameMode("procedural");
    setGameKey((k) => k + 1);
    setView("playing");
  };

  const handleOpenEditor = () => setView("editor");

  const handlePlayTest = (levelString: string) => {
    setCustomLevelString(levelString);
    setGameMode("custom");
    setGameKey((k) => k + 1);
    setView("playing");
  };

  if (view === "menu") {
    return <Menu onStart={handleStart} onOpenEditor={handleOpenEditor} />;
  }

  if (view === "editor") {
    return <LevelEditor onPlayTest={handlePlayTest} onBack={handleBackToMenu} />;
  }

  return (
    <Game
      key={gameKey}
      mode={gameMode}
      customLevelString={customLevelString}
      onBackToMenu={handleBackToMenu}
      onPlayEndless={handlePlayEndless}
      onOpenEditor={handleOpenEditor}
    />
  );
}
