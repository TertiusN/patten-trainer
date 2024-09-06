'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import DosSelect, { DosNumberInput } from './DosCustom';

const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const AVAILABLE_TICKERS = ['BTC', 'ETH', 'SOL'];

export default function HomePage({ onStartGame }) {
  const [selectedTimeframes, setSelectedTimeframes] = useState(['15m']);
  const [selectedTicker, setSelectedTicker] = useState('BTC');
  const [candleHistory, setCandleHistory] = useState(25);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const handleTimeframeChange = (timeframe) => {
    console.log('Current selectedTimeframes:', selectedTimeframes);
    console.log('Timeframe clicked:', timeframe);

    setSelectedTimeframes(prev => {
      let newTimeframes;
      if (prev.includes(timeframe)) {
        newTimeframes = prev.filter(tf => tf !== timeframe);
      } else if (prev.length < 3) {
        newTimeframes = [...prev, timeframe];
      } else {
        newTimeframes = prev;
      }
      console.log('New selectedTimeframes:', newTimeframes);
      return newTimeframes;
    });
  };

  useEffect(() => {
    fetchLeaderboard(); // Fetch leaderboard data on initial render
  }, [showLeaderboard]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('/api/leaderboard');
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const handleStartGame = () => {
    onStartGame({
      timeframes: selectedTimeframes,
      ticker: selectedTicker,
      candleHistory: candleHistory
    });
  };

  // Add this useEffect to log changes to selectedTimeframes
  useEffect(() => {
    console.log('selectedTimeframes updated:', selectedTimeframes);
  }, [selectedTimeframes]);

  return (
    <div className="container mx-auto max-w-2xl font-vt323">
      <h1 className="text-4xl font-bold mb-6 text-center">Fractal Trainer v1.0</h1>
      
      <p className="text-yellow-500 text-center text-xl">
        Pattern recognition game for crypto trading. Choose your timeframes, context depth and ticker.
        <br />
        <br/>Predict the next candle and earn points:
        <br /> - Earn 100 Points for correct direction
        <br /> - Earn bonus points for accuracy
        <br /> - Lose 50 points for incorrect direction
      </p>

      <div className="mb-6 border-2 border-white p-4">
        <h2 className="text-2xl font-semibold mb-2">Game Settings</h2>
        
        <div className="mb-4">
          <h3 className="font-medium mb-1">Select Timeframes (max 3):</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                className={`${selectedTimeframes.includes(tf) ? 'bg-white text-[#000080]' : ''}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

    <div className="mb-4">
        <h3 className="font-medium mb-1">Select Ticker:</h3>
        <DosSelect
          options={AVAILABLE_TICKERS}
          value={selectedTicker}
          onChange={setSelectedTicker}
        />
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-1">Candle History:</h3>
        <DosNumberInput
          value={candleHistory}
          onChange={setCandleHistory}
          min={5}
          max={30}
        />
      </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleStartGame}
          className="dos-button mr-4"
        >
          Start Game
        </button>

        <button 
          className="dos-button"
          onClick={() => setShowLeaderboard(!showLeaderboard)}
        >
          {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
        </button>
      </div>

      {showLeaderboard && (
        <div className="mt-4 border-2 border-white p-4">
          <h3 className="text-3xl font-bold mb-2">Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index}>{entry.name}: {entry.score}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}