'use client';

import { useState } from 'react';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSettings, setGameSettings] = useState(null);

  const startGame = (settings) => {
    setGameSettings(settings);
    setGameStarted(true);
  };

  return (
    <div>
      {!gameStarted ? (
        <HomePage onStartGame={startGame} />
      ) : (
        <GamePage settings={gameSettings} />
      )}
    </div>
  );
}