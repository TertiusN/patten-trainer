'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const AVAILABLE_TICKERS = ['BTC', 'ETH', 'SOL'];

export default function HomePage({ onStartGame }) {
  const [selectedTimeframes, setSelectedTimeframes] = useState(['15m']);
  const [selectedTicker, setSelectedTicker] = useState('BTC');
  const [candleHistory, setCandleHistory] = useState(25);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframes(prev => {
      if (prev.includes(timeframe)) {
        return prev.filter(tf => tf !== timeframe);
      } else if (prev.length < 3) {
        return [...prev, timeframe];
      }
      return prev;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Fractal Trainer</h1>
      
      <p className="mb-6">
        Fractal Trainer is a game designed to help you improve your cryptocurrency price prediction skills.
        You'll be shown historical price data and asked to predict the next price movement.
        Test your analysis skills and see how well you can read the market!
      </p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Game Settings</h2>
        
        <div className="mb-4">
          <h3 className="font-medium mb-1">Select Timeframes (max 3):</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                className={`px-3 py-1 rounded ${selectedTimeframes.includes(tf) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium mb-1">Select Ticker:</h3>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {AVAILABLE_TICKERS.map(ticker => (
              <option key={ticker} value={ticker}>{ticker}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <h3 className="font-medium mb-1">Candle History:</h3>
          <input
            type="number"
            min="5"
            max="30"
            value={candleHistory}
            onChange={(e) => setCandleHistory(Math.max(5, Math.min(30, parseInt(e.target.value))))}
            className="border rounded px-2 py-1 w-20"
          />
        </div>
      </div>

      <button
        onClick={handleStartGame}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Start Game
      </button>

      <button 
        className="btn bg-blue-500 ml-4" 
        onClick={() => setShowLeaderboard(!showLeaderboard)}
      >
        {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
      </button>

      {showLeaderboard && (
        <div className="leaderboard mt-4">
          <h3 className="text-lg font-bold">Leaderboard</h3>
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