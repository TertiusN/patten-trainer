'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import components that might cause SSR issues
const HomePage = dynamic(() => import('./components/HomePage'), { ssr: false });
const GamePage = dynamic(() => import('./components/GamePage'), { ssr: false });

export default function Page() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSettings, setGameSettings] = useState(null);

  const handleStartGame = (settings) => {
    setGameSettings(settings);
    setGameStarted(true);
  };

  return (
    <main>
      {!gameStarted ? (
        <HomePage onStartGame={handleStartGame} />
      ) : (
        <GamePage settings={gameSettings} />
      )}
    </main>
  );
}